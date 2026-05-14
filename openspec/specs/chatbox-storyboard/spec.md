## ADDED Requirements

### Requirement: 视频编辑页左侧支持聊天驱动分镜
系统 SHALL 在项目编辑页将左侧面板替换为聊天面板，允许用户通过自然语言多轮迭代生成分镜草案。

#### Scenario: 用户发起首轮分镜生成
- **WHEN** 用户输入分镜需求并发送
- **THEN** 系统调用 `POST /llm/storyboard/draft` 生成草案版本 `v1`
- **AND** 在聊天区域展示草案摘要（镜头数、总时长）

#### Scenario: 用户多轮迭代修改分镜
- **WHEN** 用户在已有草案基础上继续发送修改指令
- **THEN** 系统基于当前草案生成下一版本 `vN+1`
- **AND** 展示本轮变更摘要（diff）

### Requirement: 分镜草案必须满足强约束 schema
系统 SHALL 对 LLM 返回的分镜草案执行严格 schema 校验，不符合约束时拒绝入库。

#### Scenario: 草案超过镜头上限
- **WHEN** LLM 返回镜头数量大于 5
- **THEN** 系统返回 `422 CONSTRAINT_VIOLATION`
- **AND** 不创建新草案版本

#### Scenario: 草案时长越界
- **WHEN** 任一镜头 `duration` 小于 1 或大于 12
- **THEN** 系统返回 `422 CONSTRAINT_VIOLATION`
- **AND** 不创建新草案版本

#### Scenario: LLM 返回非 JSON
- **WHEN** LLM 返回内容无法解析为 JSON
- **THEN** 系统返回 `422 INVALID_LLM_FORMAT`
- **AND** 不创建新草案版本

### Requirement: 分镜草案版本需持久化
系统 SHALL 将每轮成功校验的分镜草案持久化到数据库，并为同一项目分配递增版本号。

#### Scenario: 成功生成新版本
- **WHEN** 草案通过校验
- **THEN** 系统持久化 `storyboard_drafts` 记录
- **AND** 同一项目的 `version` 按 `+1` 递增

### Requirement: 支持草案应用到项目工程
系统 SHALL 支持将指定草案版本以 `replace_all` 模式事务化应用到项目分镜数据。

#### Scenario: 用户确认应用草案
- **WHEN** 用户在聊天面板点击“应用到工程”并确认
- **THEN** 系统调用 `POST /projects/:id/storyboard/apply`
- **AND** 以事务方式重建 shots 与 edges
- **AND** 应用成功后返回镜头数并刷新编辑画布

#### Scenario: 应用过程中失败
- **WHEN** 应用事务中任一步失败
- **THEN** 系统回滚全部写入并返回 `500 APPLY_TRANSACTION_FAILED`
