## MODIFIED Requirements

### Requirement: 导演式系统提示词
系统 SHALL 使用 phase-aware 角色化系统提示词驱动整个创作流程，根据当前 prep 节点类型动态切换 LLM 角色。

#### Scenario: 人物形象阶段切换选角导演角色
- **WHEN** 当前编辑的 prep 节点类型为 character 且调用 `POST /llm/prep/stream`
- **THEN** 系统提示词 SHALL 注入"选角导演"角色指令，引导追问外观、服饰、特征
- **AND** LLM SHALL 在信息足够时输出 `{ characters: [...] }` 结构化 JSON

#### Scenario: 世界观阶段切换世界观设计师角色
- **WHEN** 当前编辑的 prep 节点类型为 world_setting 且调用 `POST /llm/prep/stream`
- **THEN** 系统提示词 SHALL 注入"世界观设计师"角色指令，引导追问时代、地点、氛围
- **AND** LLM SHALL 在信息足够时输出 `{ era, location, atmosphere, rules, visualStyle }` 结构化 JSON

#### Scenario: 故事梗概阶段切换故事编剧角色
- **WHEN** 当前编辑的 prep 节点类型为 story_outline 且调用 `POST /llm/prep/stream`
- **THEN** 系统提示词 SHALL 注入"故事编剧"角色指令，引导追问前提、情节点、调性
- **AND** LLM SHALL 在信息足够时输出 `{ premise, plotBeats, tone, targetShotCount }` 结构化 JSON

#### Scenario: Prep 阶段 LLM 不生成分镜
- **WHEN** 系统通过 `POST /llm/prep/stream` 处理 prep 对话
- **THEN** LLM SHALL 仅进行追问和结构化提取
- **AND** 不执行分镜 JSON 生成

#### Scenario: 分镜阶段注入全部 Prep 约束
- **WHEN** 已确认 prep 节点存在且调用 `POST /llm/storyboard/draft/stream`
- **THEN** 系统提示词 MUST 注入所有已确认 prep 节点的完整约束（人物、世界观、故事）
- **AND** 导演式输出 SHALL 保持约束一致性
- **AND** storyOutline.targetShotCount SHALL 约束最大镜头数
