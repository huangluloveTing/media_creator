## MODIFIED Requirements

### Requirement: Prep 结构化提取使用 Zod 校验
系统 SHALL 在 prep 对话阶段对 LLM 输出的结构化 JSON 使用 Zod schema 校验。

#### Scenario: 人物形象提取结果通过 Zod 校验
- **WHEN** LLM 在 prep 对话中输出 `{ characters: [...] }` JSON
- **THEN** 系统 SHALL 使用 `characterDataSchema.safeParse()` 校验
- **AND** 校验通过后回写到 PrepNode.data

#### Scenario: 世界观提取结果通过 Zod 校验
- **WHEN** LLM 输出 `{ era, location, ... }` JSON
- **THEN** 系统 SHALL 使用 `worldSettingDataSchema.safeParse()` 校验

#### Scenario: Zod 校验失败时的处理
- **WHEN** prep 提取的 JSON 不符合 Zod schema
- **THEN** 系统 SHALL 记录字段级错误日志
- **AND** 向用户反馈提取失败，引导重新描述
