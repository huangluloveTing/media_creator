## Context

当前系统已实现表单式人物形象节点（CharacterNode）和基础 Chatbox 状态机（`character_drafting → character_confirmed → storyboard`），但创建角色只能通过手动填表。用户希望在 Chatbox 中通过 LLM 对话来创建人物形象，并能多轮迭代直到满意。同时，用户需要在分镜前建立多种类型的"前置准备节点"（人物形象、世界观设定、故事梗概），而非仅有人物形象一种。

本次设计将 CharacterNode 重构为通用 PrepNode 抽象层的子类型，并以对话为主要创建方式。

## Goals / Non-Goals

**Goals:**
- 设计可扩展的 PrepNode 抽象层，支持 Character / WorldSetting / StoryOutline 三种类型，未来可扩展
- Chatbox 对话驱动 prep 节点创建：LLM 多轮追问 → 结构化提取 → 回写节点
- 同一 Chatbox 内支持多个 prep 节点的自然流转（下拉切换 + 自然语言切换）
- LLM system prompt 根据当前 prep 节点类型动态切换角色
- 分镜生成时注入全部已确认 prep 节点约束

**Non-Goals:**
- 不引入外部图片素材上传或视觉 embedding
- 不改动视频渲染/合成引擎
- 不引入多人协作审批流程
- 不在此次变更中实现超过 3 种 prep 节点类型

## Decisions

### 1. PrepNode 抽象层设计

**决策：** 定义 `PrepNode` 基类接口，使用 `type` 字段区分子类型，项目中以有序数组 `prepNodes` 存储。

```typescript
interface PrepNode {
  id: string;
  type: 'character' | 'world_setting' | 'story_outline';
  status: 'drafting' | 'confirmed';
  order: number;
  data: CharacterData | WorldSettingData | StoryOutlineData;
}

interface CharacterData { characters: CharacterProfile[]; }
interface CharacterProfile {
  name: string; appearance: string[]; outfit: string[];
  traits: string[]; immutable: string[];
}
interface WorldSettingData {
  era: string; location: string; atmosphere: string[];
  rules: string[]; visualStyle: string;
}
interface StoryOutlineData {
  premise: string; plotBeats: string[];
  tone: string; targetShotCount: number;
}
```

**备选方案：** 每种节点独立存储（无共同基类）。未采用——不便于统一管理排序、状态和批量约束注入。

### 2. Chatbox 状态机升级

**决策：** 将状态机从角色专用改为 prep 通用：
`prep_drafting → prep_confirmed → storyboard_drafting → storyboard_refining`

- `currentPrepNodeId` 追踪当前编辑的节点
- 前端门控 + 后端兜底校验：全部确认后允许分镜生成

### 3. 对话驱动的 Prep 创建流程

- LLM 识别意图 → 多轮追问 → 结构化 JSON 提取 → 回写节点 → 用户确认
- LLM 在 prep 阶段不生成分镜，仅做数据填充
- 追问轮数由用户自然语言控制

### 4. 双通道导航

- **显式导航**：Chatbox 顶部下拉选择器
- **自然语言导航**：识别"切换到世界观设定"等意图自动切换

### 5. Phase-Aware System Prompt

| 阶段 | 角色 | 任务 |
|------|------|------|
| character | 选角导演 | 追问外观/服饰/特征，输出 CharacterData |
| world_setting | 世界观设计师 | 追问时代/地点/氛围/规则，输出 WorldSettingData |
| story_outline | 故事编剧 | 追问前提/情节点，输出 StoryOutlineData |
| storyboard | 分镜导演 | 基于全部 prep 约束生成分镜 |

### 6. Prep 约束注入分镜生成

分镜生成时收集所有 `confirmed` 节点数据注入 LLM prompt，storyOutline.targetShotCount 可覆盖默认镜头上限。

## Risks / Trade-offs

- [LLM 结构化提取不稳定] → 明确的 JSON schema 约束，解析失败重试或手动填写
- [多 prep 节点增加操作负担] → 不强制全部完成，至少确认一个人物形象即可
- [对话切换节点上下文混乱] → 切换时插入系统分隔线，保留历史
- [前端状态复杂度上升] → 收敛到 ProjectContext
