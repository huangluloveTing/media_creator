## 1. 删除 SSE 服务端代码

- [x] 1.1 删除 `apps/server/src/modules/seedance/generation-event.service.ts`
- [x] 1.2 删除 `apps/server/src/modules/seedance/generation-event.controller.ts`
- [x] 1.3 从 `apps/server/src/modules/seedance/seedance.module.ts` 移除 `GenerationEventService`、`GenerationEventController` 和相关 import

## 2. Worker 移除 SSE 依赖

- [x] 2.1 从 `generation.worker.ts` 移除 `GenerationEventService` 的 import 和 constructor 注入
- [x] 2.2 修改 `emitAndRecalculate()` 方法：移除 `eventService.emit()` 调用，只保留 `projectService.recalculateStatus()`

## 3. 恢复前端轮询

- [x] 3.1 修改 `ProjectEditorPage.tsx`：恢复 `usePollGenerationStatus()` 调用，替换 `useGenerationStream`
- [x] 3.2 确保 `usePollGenerationStatus` 的依赖项正确，在点击生成后立即触发轮询
- [x] 3.3 删除 `useGenerationStream.ts` hook 文件

## 4. 验证

- [x] 4.1 后端编译通过 (`npx tsc --noEmit` exit=0)
- [x] 4.2 前端编译通过 (`npx tsc --noEmit` exit=0)
- [x] 4.3 确认无 `useGenerationStream`、`GenerationEventService`、`GenerationEventController` 残留引用（仅 dist/ 有 stale 缓存）
