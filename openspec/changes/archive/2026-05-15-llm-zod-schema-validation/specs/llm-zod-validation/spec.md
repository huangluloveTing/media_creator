## ADDED Requirements

### Requirement: LLM 输出使用 Zod schema 进行结构化校验
系统 SHALL 使用 Zod 声明式 schema 定义分镜和 prep 数据结构，并在 LLM 输出时使用 Vercel AI SDK 的 `generateObject` 或 `generateText` + `.safeParse()` 进行校验。

#### Scenario: 分镜生成使用 generateObject 保证输出格式
- **WHEN** 系统调用 LLM 生成分镜草案
- **THEN** 系统 SHALL 使用 `generateObject({ schema: storyboardSchema })`
- **AND** 返回的 object SHALL 已通过 Zod 校验
- **AND** 不需要额外 JSON 解析或正则提取

#### Scenario: Prep 对话使用 generateText + Zod safeParse
- **WHEN** 系统调用 LLM 进行 prep 对话式提取
- **THEN** 系统 SHALL 使用 `generateText` 获取全文
- **AND** 对提取的 JSON 执行 `.safeParse()` 校验

#### Scenario: Zod schema 提供 TypeScript 类型推导
- **WHEN** 系统定义 Zod schema
- **THEN** TypeScript 类型 SHALL 通过 `z.infer<typeof schema>` 自动推导
- **AND** 编译时类型与运行时校验保持同步

### Requirement: 字段级错误诊断
系统 SHALL 在校验失败时返回字段级错误信息。

#### Scenario: 单个字段校验失败
- **WHEN** LLM 返回数据中 `duration: 99`
- **THEN** 校验结果 SHALL 包含 `shots[0].duration: Number must be less than or equal to 12`

#### Scenario: 多个字段校验失败
- **WHEN** LLM 返回数据中多个字段不合规
- **THEN** 校验结果 SHALL 列出全部错误位置和原因
