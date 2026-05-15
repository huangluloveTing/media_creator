## 1. Dependencies & Setup

- [x] 1.1 Install `zod`, `ai`, `@ai-sdk/openai` in apps/server
- [x] 1.2 Configure AI SDK provider with existing OpenAI-compatible baseURL from settings

## 2. Zod Schema Definition

- [x] 2.1 Define `storyboardShotSchema` and `storyboardSchema` with Zod (shots, duration bounds, enum constraints)
- [x] 2.2 Define `characterDataSchema`, `worldSettingDataSchema`, `storyOutlineDataSchema` for prep extraction
- [x] 2.3 Export TypeScript types via `z.infer<typeof schema>` to replace existing interfaces

## 3. LlmService Refactor

- [x] 3.1 Replace `openai.chat.completions.create` in `draftStoryboard` with `generateObject({ schema: storyboardSchema })`
- [x] 3.2 Replace `openai.chat.completions.create` (streaming) with OpenAI SDK streaming + Zod safeParse
- [x] 3.3 Update `draftPrepStream` to use OpenAI SDK streaming + Zod safeParse
- [x] 3.4 Remove `buildStoryboardUserMessage` hand-rolled JSON construction (schema is now in Zod)

## 4. Schema File Cleanup

- [x] 4.1 Remove `parseJsonResponse`, `validateStoryboardPayload` from `storyboard.schema.ts`
- [x] 4.2 Remove `ensureInstruction` (replaced by Zod `.min(1)`)
- [x] 4.3 Update imports in `storyboard.service.ts` and `llm.controller.ts`

## 5. StoryboardService Adaptation

- [x] 5.1 Update `persistDraftFromRaw` → `persistDraft` to accept `StoryboardPayload` directly
- [x] 5.2 Update `validateStoryboardPayload` call sites to use Zod `storyboardSchema.safeParse()`
- [x] 5.3 Update `listDrafts` and `applyDraft` to use Zod schema validation

## 6. Testing

- [x] 6.1 Update existing tests for new Zod API (mock returns StoryboardPayload objects, not JSON strings)
- [x] 6.2 Add Zod schema unit tests (valid, invalid shots, invalid duration, enum constraints, defaults)
- [x] 6.3 Integration tests pass with mocked generateObject
- [x] 6.4 E2E test: multi-round draft consistency with Zod validation
