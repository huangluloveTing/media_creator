## 1. MinIO Docker 容器启动

- [x] 1.1 启动 MinIO 容器：`docker run -d --name minio ...`
- [x] 1.2 验证 MinIO 可访问：`curl http://localhost:9000` → 200

## 2. StorageService 封装

- [x] 2.1 新增 `storage.module.ts` 和 `storage.service.ts`
- [x] 2.2 `storage.service.ts`：upload, getPresignedUrl, objectExists
- [x] 2.3 `onModuleInit`：自动检查/创建 bucket
- [x] 2.4 注册到 `app.module.ts`
- [x] 2.5 安装 `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`
- [x] 2.6 `.env` 新增 S3 配置
- [x] 2.7 pnpm install

## 3. 修改 Seedance 下载流程（上传到 MinIO）

- [x] 3.1 `generation.worker.ts` 注入 `StorageService`，`persistVideo` 改为下载到临时文件 → 上传 MinIO → 删除临时文件 → 存 object key
- [x] 3.2 `task.localPath` 改为 MinIO object key `projects/{projectId}/shots/{order}.mp4`
- [x] 3.3 末帧也上传到 MinIO

## 4. 修改合并流程（上传到 MinIO）

- [x] 4.1 Project entity 新增 `finalVideoKey` 字段
- [x] 4.2 `project.controller.ts` merge 改为 FFmpeg 输出临时文件 → 上传 MinIO → 存 key
- [x] 4.3 `project.service.ts` 新增 `updateFinalVideoKey` 方法

## 5. 视频预览接口

- [x] 5.1 `shot.controller.ts` `GET :id/video` 改为返回 presigned URL
- [x] 5.2 新增 `GET /api/projects/:id/final-video` 返回合并视频 presigned URL
- [x] 5.3 `Project` 共享类型新增 `finalVideoKey`

## 6. 前端适配

- [x] 6.1 `api/client.ts` `getShotVideoUrl` 改为 async（先 fetch JSON 获取 presigned URL）
- [x] 6.2 `ShotProperties.tsx` 在 `status=completed` 时 fetch presigned URL
- [x] 6.3 `<video>` 使用 presigned URL 播放

## 7. 验证

- [x] 7.1 后端编译通过
- [x] 7.2 前端编译通过
- [ ] 7.3 MinIO bucket 自动创建成功
- [ ] 7.4 生成分镜后能在 MinIO Console 看到视频文件
- [ ] 7.5 合并后能在 MinIO Console 看到 final.mp4
- [ ] 7.6 前端能正常播放视频
