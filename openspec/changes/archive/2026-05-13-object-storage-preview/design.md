## Context

当前所有视频文件存储在本地磁盘的 `OUTPUT_DIR=./output` 目录。视频播放通过 NestJS `res.sendFile()` 代理。这种方式的问题：
- 文件分散在 `output/{projectId}/shots/{order}.mp4` 等路径
- 浏览器通过 NestJS 代理下载，无法直接访问文件
- 后续多实例部署时文件不可共享

引入 MinIO（S3 兼容）对象存储统一管理视频文件。

## Goals / Non-Goals

**Goals:**
- MinIO Docker 容器运行，持久化存储视频文件
- `StorageService` 封装所有 S3 操作（保证可替换）
- Seedance 下载的 shot 视频存到 MinIO
- FFmpeg 合并的 final 视频存到 MinIO
- 前端预览视频使用 presigned URL（无需服务端代理）
- 合并视频也有预览接口

**Non-Goals:**
- 不改动 FFmpeg 合并逻辑本身
- 不改动 Seedance submit/poll 逻辑
- 不删除本地文件系统存储（MinIO 作为增量，本地文件仍保留以避免迁移丢失）

## Architecture

```
                    MinIO (Docker)
                   localhost:9000
                        │
                  ┌─────┴─────┐
                  │           │
          Upload video    Presigned URL
                  │           │
        ┌─────────┴─┐    ┌───┴────────┐
        │ Seedance  │    │  Frontend  │
        │ download  │    │  <video>   │
        └───────────┘    └────────────┘

Object Key 约定:
  projects/{projectId}/shots/{order}.mp4      ← 单分镜视频
  projects/{projectId}/final.mp4              ← 合并后的完整视频
```

## Decisions

**Decision 1: MinIO + AWS SDK v3**

`@aws-sdk/client-s3` 是标准 S3 SDK，MinIO 完全兼容。配置指向 MinIO endpoint 即可，未来可无缝切换到真实 S3 / 其他兼容服务。

**Decision 2: Presigned URL 替代服务端代理**

`@aws-sdk/s3-request-presigner` 生成带过期时间的临时 URL，前端 `<video>` 标签直接播放。优点：不占用服务端带宽，支持 Range 请求（拖动进度条），无需额外代理代码。URL 默认 1 小时过期，可配。

**Decision 3: Bucket 初始化自动完成**

`StorageService.onModuleInit` 检查 bucket 是否存在，不存在则创建。

**Decision 4: localPath 仍然保留但语义变更**

`generation_tasks.localPath` 字段不再存储文件系统路径，改为存储 MinIO object key（如 `projects/{id}/shots/1.mp4`）。`GET /api/shots/:id/video` 返回 presigned URL。

**Decision 5: Project entity 新增 `finalVideoUrl` 字段**

存储最终合成视频的 presigned URL（每次生成后刷新）。前端通过 `GET /api/projects/:id` 获取。

## Risks / Trade-offs

- **Risk: Presigned URL 过期** → 默认 1h 过期，前端播放时若 403 需重新获取。Mitigation：前端在视频播放出错时自动重新请求 URL
- **Risk: MinIO 容器数据丢失** → `docker run -v minio-data:/data` 持久化 volume，重启不丢失
- **Risk: 临时文件磁盘占用** → 每次下载后上传完成即删除临时文件，磁盘只保留 5 分钟内的临时数据
