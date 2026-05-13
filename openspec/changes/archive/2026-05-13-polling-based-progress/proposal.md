## Why

当前前端进度获取使用 SSE 方案，但 SSE 增加了不必要的复杂性（独立的 EventService/EventController/前端 hook）。前端只需要简单的定时轮询 `GET /api/projects/:id/full` 就能获取所有分镜的最新状态。轮询方案更简单可靠，且 `usePollGenerationStatus` hook 已有实现。

## What Changes

- **删除 SSE 服务端代码**：移除 `GenerationEventService`、`GenerationEventController`、`generation-event.service.ts`、`generation-event.controller.ts`
- **删除 SSE 前端代码**：移除 `useGenerationStream.ts` hook
- **恢复并修复轮询**：恢复 `usePollGenerationStatus` 的调用，确保在 `generateShot` 接口返回后立即触发轮询
- **Worker 不再推 SSE**：`generation.worker.ts` 中移除 `GenerationEventService` 依赖，改为纯 DB 写 + 不推事件
- **清理模块注册**：`seedance.module.ts` 移除 SSE 相关 imports

## Capabilities

### Modified Capabilities
- `realtime-progress`: 从 SSE 改为轮询方案。所有关于 SSE endpoint / SSE hook 的需求替换为轮询 endpoint + polling hook

## Impact

- **删除**：`apps/server/src/modules/seedance/generation-event.service.ts`
- **删除**：`apps/server/src/modules/seedance/generation-event.controller.ts`
- **删除**：`apps/client/src/hooks/useGenerationStream.ts`
- **修改**：`apps/server/src/modules/seedance/generation.worker.ts` — 移除 `GenerationEventService` 注入和 emit 调用
- **修改**：`apps/server/src/modules/seedance/seedance.module.ts` — 移除 SSE 相关 imports
- **修改**：`apps/client/src/pages/ProjectEditorPage.tsx` — 恢复 `usePollGenerationStatus`
- **修改**：`apps/server/src/modules/shot/shot.controller.ts` — 若不需要则移除 `InjectRepository(GenerationTask)`（由 video endpoint 使用，保留）
