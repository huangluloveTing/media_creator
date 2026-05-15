## MODIFIED Requirements

### Requirement: 分镜草案必须满足强约束 schema
系统 SHALL 使用 Zod schema + Vercel AI SDK `generateObject` 保证 LLM 返回的分镜草案符合 schema，不符合时拒绝入库。

#### Scenario: 草案超过镜头上限
- **WHEN** LLM 返回镜头数量大于 5
- **THEN** Zod 校验 SHALL 失败并返回 `shots: Array must contain at most 5 element(s)`
- **AND** 不创建新草案版本

#### Scenario: 草案时长越界
- **WHEN** 任一镜头 `duration` 小于 1 或大于 12
- **THEN** Zod 校验 SHALL 失败并返回字段级错误信息
- **AND** 不创建新草案版本

#### Scenario: LLM 返回非 JSON
- **WHEN** AI SDK `generateObject` 返回结果不符合 schema
- **THEN** Zod 校验 SHALL 自动捕获并返回结构化错误
- **AND** 不创建新草案版本
