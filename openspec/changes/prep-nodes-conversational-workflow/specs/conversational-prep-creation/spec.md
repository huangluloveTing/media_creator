## ADDED Requirements

### Requirement: Chatbox 对话式 Prep 节点创建
系统 SHALL 在 Chatbox 中通过 LLM 驱动的对话方式创建和填充 PrepNode，支持多轮追问迭代直到用户满意。

#### Scenario: 用户通过对话描述角色
- **WHEN** 用户在 Chatbox 中输入人物描述
- **THEN** 系统 SHALL 识别为人物形象 prep 意图
- **AND** 若当前不存在对应类型的 prep 节点则自动创建
- **AND** LLM SHALL 通过 `POST /llm/prep/stream` 端点进行 phase-aware 对话

#### Scenario: LLM 多轮追问细化
- **WHEN** 用户初始描述信息不足
- **THEN** LLM SHALL 针对缺失字段主动提问
- **AND** 用户可多轮回答直到满意
- **AND** 对话历史 SHALL 持续保留不被中间事件覆盖

#### Scenario: 结构化提取并回写节点
- **WHEN** LLM 在对话中输出符合 prep schema 的结构化 JSON
- **THEN** 系统 SHALL 通过 SSE `prep-extracted` 事件推送提取结果
- **AND** 前端 SHALL 解析回写到对应 PrepNode.data
- **AND** 在 Chatbox 中展示格式化摘要并提示用户确认或修改

#### Scenario: 对话中微调已确认节点
- **WHEN** 用户在 Chatbox 中对已提取的 prep 数据提出修改
- **THEN** 系统 SHALL 定位目标字段并更新
- **AND** 不影响其他已确认字段

### Requirement: Prep 阶段自动路由与门控
系统 SHALL 在 prep 未全部确认时将用户消息自动路由到 prep 对话流程，而非直接拦截。

#### Scenario: Prep 未确认时发送消息
- **WHEN** 至少一个必需 prep 节点未确认且用户发送消息
- **THEN** 系统 SHALL 将消息路由到 `runPrepConversation` 流程
- **AND** 调用 `POST /llm/prep/stream` 进行 phase-aware 对话
- **AND** 不执行分镜生成

#### Scenario: Prep 节点不存在时自动创建
- **WHEN** 新项目没有任何 prep 节点且用户开始对话
- **THEN** 系统 SHALL 自动创建当前 prep 类型对应的节点（默认 drafting 状态）
- **AND** 节点的 data 字段 SHALL 填充类型对应的空默认值

#### Scenario: 全部 Prep 确认后进入分镜
- **WHEN** 所有 prep 节点均已确认且用户发送消息
- **THEN** 系统 SHALL 调用 `POST /llm/storyboard/draft/stream` 生成分镜
- **AND** 注入全部已确认 prep 约束

### Requirement: 自然语言确认 Prep 节点
系统 SHALL 支持用户通过自然语言确认当前编辑的 prep 节点。

#### Scenario: 用户说"确认人物形象"
- **WHEN** 用户输入匹配确认意图（如"确认""可以了""好了"）且提及 prep 类型
- **THEN** 系统 SHALL 将对应 prep 节点标记为 confirmed
- **AND** 在 Chatbox 中显示确认消息

#### Scenario: 通用确认（未指定类型）
- **WHEN** 用户输入"确认"或"可以了"未指定具体类型
- **THEN** 系统 SHALL 确认当前正在编辑的 prep 节点
- **AND** 若全部 prep 已确认则提示可以开始分镜

### Requirement: 同一 Chatbox 内 Prep 节点自然切换
系统 SHALL 支持用户在同一个 Chatbox 中自然地在不同 PrepNode 之间切换编辑目标。

#### Scenario: 下拉选择器切换节点
- **WHEN** 用户通过下拉选择器切换当前编辑的 prep 节点
- **THEN** 系统 SHALL 更新 currentPrepNodeId
- **AND** LLM system prompt SHALL 切换为对应 prep 类型的角色
- **AND** 在对话中插入系统分隔线标记切换

#### Scenario: 自然语言切换节点
- **WHEN** 用户在对话中表达切换 prep 节点意图（如"切换到世界观设定"）
- **THEN** 系统 SHALL 识别意图并触发节点切换
- **AND** 若目标节点不存在则自动创建

#### Scenario: 切换后保留对话历史
- **WHEN** 用户切换当前编辑的 prep 节点
- **THEN** 对话历史 SHALL 保留
- **AND** 系统分隔线 SHALL 标记切换点
