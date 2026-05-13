## Context

当前生成流程的核心理念问题是：用 DB 表 + raw SQL 当消息队列用。DB 队列缺少标准作业框架应有的能力——可见性超时、死信队列、自动重试、标签/分组、事件通知——这些恰好是 BullMQ 的标准能力。BullMQ + `@nestjs/bullmq` 是 NestJS 生态的标准后台作业方案。

## Goals / Non-Goals

**Goals:**
- 用 BullMQ 替代 DB 队列管理视频生成任务
- Worker 通过 `@Processor` 装饰器声明，BullMQ 管理生命周期
- 通过 BullMQ Events 驱动 SSE 实时推送
- `generation_tasks` 表保留为只读模型，供前端通过 GET 查询
- API Key 启动时校验

**Non-Goals:**
- 不做 DB 迁移（`synchronize: true` 自动同步）
- `generation_tasks` 不再由 worker 直接读写（改为 BullMQ job 管理）
- 不改动 SeedanceService 的 API 调用签名

## Architecture

```
POST /api/shots/:id/generate
  │
  ├─ 1. 校验 API Key 可用
  ├─ 2. GenerationService.generateShot()
  │     ├─ 写 generation_tasks (status='queued')
  │     └─ BullMQ queue.add('generate-video', { shotId })
  │
  ▼
BullMQ Queue (Redis)
  │
  ▼
@Processor('generation') Worker (BullMQ 管理并发/重试/生命周期)
  │
  ├─ 3. submitToSeedance(shot) → taskId
  ├─ 4. pollUntilTerminal(taskId)
  │     └─ 每轮: 调 Seedance poll → job.updateProgress(pct)
  │                        → 写 generation_tasks (进度心跳)
  │                        → emit SSE event
  ├─ 5. succeeded:
  │     ├─ download video → save to disk
  │     ├─ update generation_tasks (completed, localPath)
  │     └─ emit SSE event
  └─ 6. failed:
        ├─ update generation_tasks (failed, errorMessage)
        └─ emit SSE event

SSE Endpoint: GET /api/projects/:id/generation-stream
  └─ GenerationEventService (Subject<event>) → EventSource
```

## Decisions

**Decision 1: BullMQ + `@nestjs/bullmq`**

替代自定义 DB 队列。
- 去重：BullMQ 的 jobId deduplication（同一 shotId 不会重复 enqueue）
- 重试：`attempts: 3, backoff: { type: 'exponential', delay: 5000 }`
- 并发：`concurrency: 3`（可通过环境变量配置）
- 可见性超时：BullMQ 自带可见性超时（`lockDuration: 300000` = 5min），worker 崩溃后自动恢复
- 事件：`@OnWorkerEvent('completed')`、`@OnWorkerEvent('failed')`、`@OnWorkerEvent('progress')`

**Decision 2: `generation_tasks` 表保留为读模型**

- `generateShot()` 写 DB（让前端 SSE 连接前就能看到 queued 状态）
- Worker 每次进度变化写 DB（让直接 REST 查询也看到最新状态）
- DB 写和 SSE 推送同时发生，不依赖任一作为唯一通道

**Decision 3: SSE 实时推送**

- `GenerationEventService` 维护 `Map<projectId, Subject<GenerationEvent>>`
- `GenerationController` 暴露 `GET /api/projects/:id/generation-stream` SSE endpoint
- BullMQ events fired → 写 DB → emit Subject → SSE 推送给前端
- 前端 `useGenerationStream` hook 监听 SSE，仅更新受影响的 shot 的 generation 字段

**Decision 4: API Key 启动验证**

- `OnApplicationBootstrap` 中调 `seedanceService.healthCheck()` 输出 warn 日志
- `generateShot` 在 enqueue 前校验 key 是否存在

## Risks / Trade-offs

- **Risk: Redis 单点故障** → 当前 demo 场景可接受。production 需 Redis Sentinel/Cluster。Mitigation：`BullModule.forRoot` 可配 sentinel 或 cluster
- **Risk: 视频下载阻塞 Worker 线程** → `downloadAndSave` 是 IO 操作，不阻塞 event loop。如果下载慢，Worker 的 `lockDuration` 超时会导致 BullMQ 认为 job 超时。Mitigation：将 download 设为独立 job 或增加 `lockDuration` 到 300s
- **Risk: 事件丢失** → BullMQ job 的 `stalledInterval` 和 `maxStalledCount` 确保 job 至少一次执行
