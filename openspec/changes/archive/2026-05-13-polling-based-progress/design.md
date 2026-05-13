## Context

当前架构中有两套并行的进度通知机制：Worker 写 DB 后通过 `GenerationEventService` → Subject → SSE 推送给前端；同时前端还有 `usePollGenerationStatus` 轮询作为 SSE 的后备。SSE 复杂度大于收益：对于单用户 demo 应用，3 秒一次的全量轮询完全够用，且 `GET /api/projects/:id/full` 已经是前端获取整个项目状态的主入口。

## Goals / Non-Goals

**Goals:**
- 删除所有 SSE 相关代码（服务端 + 前端）
- 恢复 `usePollGenerationStatus` 作为唯一的进度获取方式
- 确保点击生成后立即触发轮询
- Worker 仍然写 DB，前端通过轮询读到最新状态

**Non-Goals:**
- 不改动 BullMQ Worker 的逻辑（submit → poll → 写 DB 保持不变）
- 不改动 `GET /api/projects/:id/full` 接口
- 不改动 `generation_tasks` 数据结构

## Decisions

**Decision 1: 轮询足矣**

对于 demo 应用场景（单用户、低频并发、状态更新非实时关键），3 秒间隔的轮询完全满足要求。SSE 维护长连接和服务端 Subject map 反而增加了出错面和资源消耗。

**Decision 2: 触发时机决定轮询可靠性**

旧的轮询实现有问题：`useEffect` 依赖项中用了 `state.project?.shots.some(...)` 这个计算值，React 闭包可能导致轮询未正确启动。

重写方案：在 `handleGenerate` / `handleRetry` 中 dispatch 更新后，立刻启动一个 `setInterval` 轮询，同时 `usePollGenerationStatus` 检测到 active task 后也会启动轮询。双重保险。

**Decision 3: Worker 纯写 DB，不关心推送**

Worker 中移除 `GenerationEventService` 依赖，`persistVideo` 完成后只写 DB 并 `recalculateStatus`。前端通过轮询看到变化。

## Risks / Trade-offs

- **Risk: 轮询延迟 0~3s** → 可接受。SSE 的实时性优势在此场景中无实质收益
- **Risk: 多次重复请求** → 3s 间隔全量 10KB 数据对 demo 无压力。如果后续需要优化可加简单节流
