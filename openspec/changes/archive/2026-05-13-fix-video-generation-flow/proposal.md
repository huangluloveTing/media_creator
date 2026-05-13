## Why

当前视频生成流程存在多个关键缺陷：调用 generate 后任务进入 DB，但 worker 经常无法正确拉取结果返回前端；任务状态更新不及时或永远卡在中间状态；用户无法获得有意义的进度反馈和错误信息。需要引入标准化的作业队列框架从根本上解决这个问题。

## What Changes

- **引入 BullMQ + `@nestjs/bullmq`**：Redis 支持的标准作业队列，替代当前 raw SQL `FOR UPDATE SKIP LOCKED` 方案
- **移除所有自定义队列逻辑**：删除 `generation.queue.ts`、删除 `OnApplicationBootstrap`/`OnModuleDestroy` worker 循环、删除 `claimNext` raw SQL
- **BullMQ Worker 自动处理**：`@Processor('generation')` 装饰器 + `@Process` 方法，BullMQ 内置限并发、重试、去重
- **BullMQ 事件监听**：通过 `@OnWorkerEvent('completed')` / `@OnWorkerEvent('failed')` / `@OnWorkerEvent('progress')` 驱动 SSE 实时推送
- **`generation_tasks` 表保留**：作为前端查询用的"读模型"（read model），worker 写入进度后推 SSE，前端不再轮询
- **API Key 启动校验**：服务启动时验证 Seedance API 连通性
- **前端 SSE 实时推送**替换轮询
- **前端错误展示**：failed 状态显示具体 errorMessage

## Capabilities

### New Capabilities
- `bullmq-queue`: BullMQ 作业队列 + Worker + 事件监听，替代自定义 DB 队列
- `realtime-progress`: SSE 实时进度推送，前端即时获取任务状态变更

## Impact

- **apps/server/src/modules/seedance/generation.service.ts**: 完全重写，移除所有自定义队列逻辑，改为 BullMQ Job 模式
- **apps/server/src/modules/seedance/**: 删除 `generation.queue.ts`（已删无残留）
- **apps/server/package.json**: 新增 `@nestjs/bullmq`, `bullmq`, `ioredis` 依赖
- **apps/server/src/app.module.ts**: 注册 `BullModule.forRoot()` 连接 Redis
- **apps/server/src/modules/seedance/seedance.module.ts**: 注册 `BullModule.registerQueue()`
- **apps/client/src/hooks/usePollGenerationStatus.ts**: 替换为 SSE hook
- **新增** `GenerationEventService` 和 `GenerationEventController` 用于 SSE
- **Docker**: Redis 容器 `media_creator_redis:6379`
- **环境变量**: `REDIS_HOST`, `REDIS_PORT`
