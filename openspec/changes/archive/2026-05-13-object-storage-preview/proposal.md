## Why

当前视频文件存储在本机文件系统（`OUTPUT_DIR=./output`），视频预览接口直接从磁盘读取。这样做的问题是：视频文件分散在不同路径，无法统一管理；多机部署时文件不可共享；浏览器预览需要服务端代理。引入 MinIO（S3 兼容的对象存储）可统一管理所有视频文件，并为前端提供可靠的文件服务与预览能力。

## What Changes

- **新增 MinIO Docker 容器**：本地 S3 兼容对象存储，`localhost:9000`
- **新增 `StorageService`**：封装 MinIO 客户端（上传、下载、获取 presigned URL），可注入到其他模块
- **修改视频下载流程**：`SeedanceService.downloadAndSave` 下载到临时文件后 → 上传到 MinIO → 删除临时文件
- **修改合并视频流程**：FFmpeg 合并输出到临时文件后 → 上传到 MinIO → 删除临时文件
- **视频预览改造**：`GET /api/shots/:id/video` 改为从 MinIO 获取 presigned URL 返回给前端（302 重定向或返回 URL）
- **合并视频预览**：新增 `GET /api/projects/:id/final-video` 接口读取合并后的视频
- **`generation_tasks.localPath`** 字段改为存储 MinIO object key（如 `projects/{projectId}/shots/{order}.mp4`）
- **Project 新增 `finalVideoKey` 字段**：存储合并后的视频 object key

## Capabilities

### New Capabilities
- `object-storage`: MinIO 对象存储服务封装，提供文件上传/下载/预览 URL 能力

### Modified Capabilities
- 无（前端查看视频的能力是新增的，不改变现有 spec）

## Impact

- **Docker**: 新增 `minio/minio` 容器，端口 9000（API）+ 9001（Console）
- **新增依赖**: `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`
- **新增文件**: `apps/server/src/modules/storage/storage.service.ts`, `storage.module.ts`
- **修改**: `seedance.service.ts` — 下载后上传到 MinIO
- **修改**: `project.controller.ts` — 合并完成后上传到 MinIO
- **修改**: `shot.controller.ts` — `GET :id/video` 使用 presigned URL
- **新增**: `GET /api/projects/:id/final-video` — 返回合并视频的 presigned URL
- **环境变量**: `S3_ENDPOINT`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET`, `S3_REGION`
