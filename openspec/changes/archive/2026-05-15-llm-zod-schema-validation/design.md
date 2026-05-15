## Context

当前 LLM 调用链：`LlmService` → OpenAI SDK `chat.completions.create` → 返回文本 → `parseJsonResponse` 正则提取 JSON → `validateStoryboardPayload` 手写 if-else 校验。三个环节都有风险：LLM 不输出纯 JSON、正则漏匹配、校验信息不精确。

Vercel AI SDK v5 的 `generateObject` 将 Zod schema 传给 LLM provider，由 provider 在推理时强制结构化输出（如 OpenAI 的 `response_format: { type: "json_schema", json_schema: ... }`），从根本上消除了格式问题。

## Goals / Non-Goals

**Goals:**
- 用 `generateObject` + Zod schema 替代 `openai.chat.completions.create` + 正则解析
- 保留 SSE 流式体验：`generateObject` 支持 streaming
- Zod schema 同时提供 TypeScript 类型推导，消除类型定义重复
- 错误信息精确到字段级别

**Non-Goals:**
- 不改动前端 API 接口（SSE 事件格式保持兼容）
- 不更换 LLM provider（仍用 OpenAI 兼容 API）
- 不在此次变更中引入 prompt 管理框架

## Decisions

### 1. 使用 `generateObject` 替代 `chat.completions.create`

**决策**：分镜生成使用 `generateObject({ schema, system, prompt })`，让 provider 在推理时强制 JSON 输出。

```
// Before
const completion = await openai.chat.completions.create({ messages, ... });
const parsed = parseJsonResponse(completion.choices[0].message.content);
const validated = validateStoryboardPayload(parsed);

// After
const { object } = await generateObject({
  model: openai(modelName),
  schema: storyboardSchema,
  system: SYSTEM_PROMPT,
  prompt: userMessage,
});
// object 已通过 Zod 校验，类型为 StoryboardPayload
```

**备选方案**：只用 Zod 不用 AI SDK，仍需正则解析。未采用——从源头解决格式问题更好。

### 2. Prep 对话使用 `generateText` + 后置 Zod 校验

**决策**：Prep 阶段 LLM 需要先做自然语言追问/描述，再输出结构化数据。用 `generateText` 获取全文 → `extractPrepJson` 提取 JSON → Zod `.safeParse()` 校验。

**备选方案**：直接用 `generateObject`。未采用——prep 阶段 LLM 可能需要同时输出自然语言和 JSON。

### 3. Zod Schema 定义

```typescript
import { z } from 'zod';

const storyboardShotSchema = z.object({
  order: z.number().int().min(0),
  prompt: z.string().min(1),
  shotSize: z.enum(['extreme-wide','wide','medium','close-up','extreme-close-up']),
  angle: z.enum(['eye-level','low','high','dutch','aerial']),
  movement: z.enum(['static','pan','tilt','dolly','zoom','handheld']),
  duration: z.number().int().min(1).max(12),
  requiredElements: z.array(z.string()),
  forbiddenElements: z.array(z.string()),
});

const storyboardSchema = z.object({
  version: z.literal('1.0'),
  intent: z.string().min(1),
  shots: z.array(storyboardShotSchema).min(1).max(5),
});

type StoryboardPayload = z.infer<typeof storyboardSchema>;
```

### 4. 流式输出兼容

`generateObject` 本身支持 streaming。前端 SSE 事件中的 `token` 事件需要适配——AI SDK 的 `onFinish` 提供最终 object，中间 token 流可通过 `experimental_stream` 或 `generateText` + `onChunk` 获取。

**决策**：分镜流式用 `generateText` + Zod 后置校验保持纯文本 token 流；或直接在 `onFinish` 一次性返回 object 并发送 `done` 事件。

## Risks / Trade-offs

- [AI SDK 新依赖] → `ai` + `@ai-sdk/openai` 体积约 200KB，接受
- [流式体验变化] → 若用 `generateObject` 非流式，前端 token 流消失。用 `generateText` + 后置 Zod 保持流式体验
- [OpenAI 兼容 API] → `@ai-sdk/openai` 使用标准 OpenAI 端点，需确认 baseURL 配置
