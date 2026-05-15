## Why

当前 LLM 调用使用原生 OpenAI SDK + 手写 JSON 校验 + 正则提取，存在三个痛点：
1. **格式不可靠** — LLM 经常在 JSON 外包裹 markdown 代码块，`parseJsonResponse` 靠多层正则兜底
2. **校验脆弱** — 手写 if-else 缺少字段级错误定位，`INVALID_LLM_FORMAT` 对调试毫无帮助
3. **类型脱节** — TypeScript 类型定义和运行时校验是两套代码，不同步风险高

Vercel AI SDK 的 `generateObject` 原生支持 Zod schema → 结构化输出，消除了上述三个问题。

## What Changes

- 引入 `ai` + `@ai-sdk/openai`（Vercel AI SDK），替代原生 `openai` SDK 调用。
- 用 Zod schema 定义 `StoryboardPayload`、`CharacterData`、`WorldSettingData`、`StoryOutlineData`。
- 分镜生成改用 `generateObject({ schema: storyboardSchema })`，**从源头保证 JSON 格式正确**，不再需要正则提取。
- Prep 对话改用 `generateText` + 后置 Zod 校验，或 `generateObject` 直出结构化 prep 数据。
- 删除 `parseJsonResponse`、`validateStoryboardPayload` 等手写校验函数。
- 流式输出保持：`generateObject` 的 `onFinish` 回调替代现有 token 流处理。

## Capabilities

### New Capabilities
- `llm-zod-validation`: LLM 输出使用 Vercel AI SDK + Zod schema 进行结构化生成与校验，替代手写 JSON 解析和 if-else 验证。

### Modified Capabilities
- `chatbox-storyboard`: 分镜草案生成从 `openai.chat.completions.create` 改为 `generateObject` + Zod schema，输出格式由框架保证。
- `director-guided-chat`: Prep 对话的结构化提取改用 Zod schema 校验，system prompt 中嵌入 Zod schema 的 JSON 描述。

## Impact

- 后端：`llm.service.ts` 重写为 AI SDK 调用；`storyboard.schema.ts` 从手写函数改为 Zod schema 导出；删除 `parseJsonResponse` 等函数
- 依赖：新增 `ai`、`@ai-sdk/openai`、`zod`；保留 `openai` 过渡期
- 规格：新增 `llm-zod-validation`，修改 `chatbox-storyboard`、`director-guided-chat`
