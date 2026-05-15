## MODIFIED Requirements

### Requirement: Prep 约束一致性
系统 SHALL 在多轮分镜生成中维护所有已确认 prep 节点的约束，并在每轮生成时将全部 prep 约束作为硬性输入。

#### Scenario: 分镜生成时注入全部 Prep 约束
- **WHEN** 所有必需 prep 节点已确认且执行分镜生成
- **THEN** 系统 SHALL 通过 `collectPrepContext` 收集人物形象、世界观设定、故事梗概的全部约束
- **AND** 注入 LLM 输入作为硬性约束
- **AND** 输出分镜 SHALL 在所有镜头中保持这些约束的一致性

#### Scenario: 后续轮次复用 Prep 约束
- **WHEN** 用户继续迭代分镜
- **THEN** 系统将已有 prep 约束注入本轮 LLM 输入
- **AND** 输出分镜 SHALL 与已确认 prep 约束保持一致

#### Scenario: Prep 约束与用户指令冲突时提示
- **WHEN** 用户新指令与已确认 prep 节点约束冲突
- **THEN** 系统返回冲突提示并请求用户确认是否覆盖相应 prep 节点设定

#### Scenario: 分镜必须携带形象元素
- **WHEN** 人物形象 prep 节点已确认（包含多个角色的 appearance/outfit/immutable 关键词）
- **THEN** 每个分镜的 prompt SHALL 包含至少一个已确认角色关键词
- **AND** 若缺失则抛出 `CHARACTER_ELEMENTS_MISSING`

#### Scenario: 分镜必须符合世界观设定
- **WHEN** 世界观 prep 节点已确认并执行分镜生成
- **THEN** 每个分镜的场景描述 SHALL 包含已确认的 location 或 atmosphere 关键词
- **AND** 若偏离则抛出 `WORLD_SETTING_MISMATCH`

### Requirement: Prep 约束可视化反馈
系统 SHALL 在 Chatbox 侧边栏展示当前所有已确认 prep 节点的约束摘要。

#### Scenario: 展示全部 Prep 约束摘要
- **WHEN** 系统完成任意 prep 节点的确认或提取
- **THEN** Chatbox 侧边栏 SHALL 展示所有已确认 prep 节点的约束卡片
- **AND** 包含人物形象、世界观设定、故事梗概的简要内容
- **AND** 每个节点用 Tag 显示其确认状态

#### Scenario: Prep 节点更新后同步摘要
- **WHEN** 用户通过对话或面板修改并保存任意 prep 节点设定
- **THEN** Chatbox prep 约束摘要 SHALL 通过 `refreshDrafts` 同步更新
- **AND** 后续分镜生成使用更新后的约束
