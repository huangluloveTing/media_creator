## Context

现有系统已具备：
- 项目与分镜实体（shots/edges）及完整 CRUD
- ProjectEditor 三栏布局（左侧面板/中间流程图/右侧属性）
- 基础 LLM 调用能力（`/llm/enhance-prompt`）

缺失能力：
- 面向“整套分镜”的 LLM 编排接口
- 多轮草案版本管理
- 聊天迭代与工程应用链路

## Goals / Non-Goals

**Goals**
- 左侧改为聊天交互，支持多轮迭代分镜
- LLM 输出强约束 schema 并通过后端严格校验
- 草案版本持久化并可回看
- 应用分镜时事务化覆盖项目数据

**Non-Goals**
- 本期不做协同编辑与多人会话
- 本期不做流式 token 展示
- 本期不做细粒度分镜 patch

## High-Level Architecture

```text
Client(Chatbox)
  -> POST /llm/storyboard/draft
      -> Storyboard Orchestrator
      -> LLM (JSON-only)
      -> Schema Validator
      -> Draft Persistence (DB)

Client Apply
  -> POST /projects/:id/storyboard/apply
      -> Apply Service (transaction)
      -> replace_all shots + rebuild edges
```

## Data Model

新增表：`storyboard_drafts`

- `id` (uuid, pk)
- `project_id` (uuid, indexed)
- `version` (int, per-project increment)
- `instruction` (text)
- `storyboard_json` (jsonb)
- `summary` (text, nullable)
- `diff_json` (jsonb, nullable)
- `is_applied` (boolean, default false)
- `applied_at` (timestamp, nullable)
- `created_by` (uuid/string)
- `created_at` (timestamp)

约束：
- 唯一键：`(project_id, version)`

## Storyboard Schema (Server-side Source of Truth)

```json
{
  "version": "1.0",
  "intent": "string",
  "shots": [
    {
      "order": 0,
      "prompt": "string",
      "shotSize": "extreme-wide|wide|medium|close-up|extreme-close-up",
      "angle": "eye-level|low|high|dutch|aerial",
      "movement": "static|pan|tilt|dolly|zoom|handheld",
      "duration": 5,
      "requiredElements": ["string"],
      "forbiddenElements": ["string"]
    }
  ]
}
```

## Validation Rules

- `shots.length` 必须在 `1..5`
- `duration` 必须在 `1..12`
- `order` 必须连续且从 `0` 开始
- `prompt` 非空
- 枚举字段必须命中受支持值
- 顶层字段必须存在，且拒绝未知关键字段（strict mode）

## API Design

### 1) POST `/llm/storyboard/draft`

Request:
- `projectId: string`
- `instruction: string`
- `baseDraft?: StoryboardSchema`
- `constraints?: { maxShots: 5, minDuration: 1, maxDuration: 12 }`

Behavior:
- 以“当前草案（baseDraft）+ 用户新指令”请求 LLM
- 要求 LLM 返回纯 JSON
- 通过服务端 schema 校验
- 成功后写入 `storyboard_drafts`（version +1）

Response:
- `draftId`
- `version`
- `summary`
- `storyboard`
- `diff`

### 2) GET `/projects/:id/storyboard/drafts`

Response:
- 按 `version desc` 返回草案列表（含摘要与时间）

### 3) POST `/projects/:id/storyboard/apply`

Request:
- `draftId: string`
- `mode: "replace_all"`

Behavior:
- 校验 draft 属于 project
- 事务执行：清空并重建 shots（按 order）+ 重建 edges
- 标记 draft `is_applied=true` 与 `applied_at`

Response:
- `ok`
- `appliedVersion`
- `shotCount`

## Frontend Interaction Model

状态机：
- `idle` -> `drafting` -> `preview`
- `preview` -> `drafting`（继续迭代）
- `preview` -> `applying` -> `applied`
- 任意态 -> `failed`

左侧 Chatbox 区域包含：
- 消息流（用户/AI）
- 当前版本标识（vN）
- 草案摘要（镜头数、总时长）
- “应用到工程”按钮（二次确认）

## Error Handling

- LLM 返回非 JSON：`422 INVALID_LLM_FORMAT`
- schema 校验失败：`422 INVALID_STORYBOARD_SCHEMA`
- 超过镜头上限或时长范围：`422 CONSTRAINT_VIOLATION`
- 应用事务失败：`500 APPLY_TRANSACTION_FAILED`

## Risks / Trade-offs

1. 多轮对话导致语义漂移
- 方案：每轮携带当前全量草案，始终返回下一版全量 JSON

2. LLM 合法但质量一般
- 方案：先预览后应用，应用动作与生成动作解耦

3. 覆盖写入风险
- 方案：`replace_all` 前弹窗确认，并保留历史草案版本用于回退

## Rollout Plan

- 第 1 阶段：接口与数据库能力
- 第 2 阶段：左侧 Chatbox 与版本预览
- 第 3 阶段：应用链路与回归测试
