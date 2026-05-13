## 1. 安装依赖 & 配置 Redis

- [x] 1.1 `pnpm -F server add @nestjs/bullmq bullmq ioredis`
- [x] 1.2 `apps/server/src/app.module.ts` 中注册 `BullModule.forRoot()` 连接 `redis://localhost:6379`
- [x] 1.3 `apps/server/src/modules/seedance/seedance.module.ts` 中注册 `BullModule.registerQueue({ name: 'generation' })`
- [x] 1.4 删除无用的 `generation.queue.ts` 文件（已删确认无引用）
- [x] 1.5 新增 `.env` 可选：`REDIS_HOST=localhost`, `REDIS_PORT=6379`

## 2. 重写 GenerationService

- [x] 2.1 `generateShot()`：保留写 DB status='queued'，改为 `this.generationQueue.add('generate-video', { shotId }, { jobId: shotId })`
- [x] 2.2 `generateAllShots()`：遍历 pending shots 逐个调 `generateShot()`
- [x] 2.3 删除 `OnApplicationBootstrap` / `OnModuleDestroy` 钩子（BullMQ 管理 worker 生命周期）
- [x] 2.4 删除 `runWorker()` / `claimNext()` / `processTask()` 全部自定义队列方法
- [x] 2.5 删除 `sleep()` 工具函数

## 3. 新建 GenerationWorker (BullMQ Processor)

- [x] 3.1 新建 `generation.worker.ts`：`@Processor('generation')` 类
- [x] 3.2 `@Process('generate-video')` 方法：submit → poll loop → `job.updateProgress()` + 写 DB + 下载视频
- [x] 3.3 Worker 配置：`concurrency: 3`, `lockDuration: 300_000`, `attempts: 3`, `backoff: { type: 'exponential', delay: 5000 }`

## 4. SSE 实时进度推送

- [x] 4.1 新建 `GenerationEventService`：`Map<projectId, Subject<event>>`，`emit(projectId, shotId, status, progress, errorMessage)` 方法
- [x] 4.2 新建 `GenerationEventController`：`GET /api/projects/:id/generation-stream` SSE endpoint
- [x] 4.3 Worker 每次写 DB 后调 `eventService.emit()` 推送事件
- [x] 4.4 注册 `GenerationEventService` 和 `GenerationEventController` 到 `seedance.module.ts`

## 5. 前端 SSE 替换轮询

- [x] 5.1 新建 `useGenerationStream(projectId)` hook：`EventSource` 连接 SSE
- [x] 5.2 实现自动重连 + 重连后 `getProjectFull` 全量同步
- [x] 5.3 `ProjectEditorPage.tsx` 中调用 `useGenerationStream` 替代 `usePollGenerationStatus`
- [x] 5.4 保留 `usePollGenerationStatus` 作为 fallback

## 6. 前端错误展示优化

- [x] 6.1 `ShotProperties.tsx` 中 `status='failed'` 时展示 `errorMessage` 详细内容
- [x] 6.2 生成按钮 disabled 时增加有意义的提示文案

## 7. API Key 启动验证

- [x] 7.1 API Key 在 GenerationService 构造时校验（通过 SettingsService 读取 + 环境变量 fallback）
- [x] 7.2 API Key 无效时 `generateShot()` 抛异常阻止入队

## 8. 验证

- [x] 8.1 后端编译通过 (`npx tsc --noEmit`)
- [x] 8.2 前端编译通过 (`npx tsc --noEmit`)
- [x] 8.3 现有 seedance 测试通过 (2/2)
- [x] 8.4 Redis 连接正常 (docker exec redis-cli PING → PONG)
- [ ] 8.5 启动后调 generate 能看到 Worker 正确拉取并完成任务
