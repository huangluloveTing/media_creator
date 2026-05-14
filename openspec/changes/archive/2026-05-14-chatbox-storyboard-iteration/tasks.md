## 1. Backend - Schema & Persistence

- [x] 1.1 新增 `storyboard_drafts` 实体与迁移（含 `(project_id, version)` 唯一约束）
- [x] 1.2 定义并实现 Storyboard schema 校验器（strict mode）
- [x] 1.3 实现 per-project 版本号递增逻辑

## 2. Backend - Draft API

- [x] 2.1 新增 `POST /llm/storyboard/draft`
- [x] 2.2 组装 LLM system/user prompt，强制 JSON-only 输出
- [x] 2.3 校验并持久化草案，返回 `draftId/version/summary/diff/storyboard`
- [x] 2.4 错误码与错误消息规范化（422/400/500）

## 3. Backend - Query & Apply API

- [x] 3.1 新增 `GET /projects/:id/storyboard/drafts`
- [x] 3.2 新增 `POST /projects/:id/storyboard/apply`
- [x] 3.3 apply 使用事务执行 replace_all（shots + edges 重建）
- [x] 3.4 apply 成功后回写 `is_applied/applied_at`

## 4. Frontend - Chatbox Replacement

- [x] 4.1 在编辑页左侧将 `NodePalette` 替换为 `ChatboxPanel`
- [x] 4.2 实现消息流、输入框、发送状态与错误提示
- [x] 4.3 展示当前草案版本、镜头数、总时长摘要

## 5. Frontend - Iteration & Apply

- [x] 5.1 接入 draft API，支持多轮迭代（基于当前版本）
- [x] 5.2 展示每轮 diff 摘要
- [x] 5.3 “应用到工程”二次确认后调用 apply API
- [x] 5.4 apply 成功后刷新 project full 并同步画布

## 6. Tests

- [x] 6.1 单元测试：schema 校验（合法/非法/边界值）
- [x] 6.2 集成测试：draft API（JSON 解析失败、约束失败、成功）
- [x] 6.3 集成测试：apply 原子性（部分失败不落库）
- [x] 6.4 前端交互测试：多轮迭代、版本展示、应用确认
