## 1. 修复 API 客户端类型

- [x] 1.1 修复 `api/client.ts` 中 `merge` 方法的响应类型：`outputPath` → `url`
- [x] 1.2 新增 `getFinalVideoUrl` 方法封装 `GET /projects/:id/final-video`

## 2. MergeProperties 视频预览

- [x] 2.1 在 MergeProperties 中新增视频播放器区域组件（含 loading 状态）
- [x] 2.2 合成完成后自动获取 presigned URL 并显示视频
- [x] 2.3 显示"重新合成"按钮
- [x] 3.1 打开已合成完成的项目时，通过 `getFinalVideoUrl` 加载视频
- [x] 3.2 处理 finalVideoKey 为空或 URL 失效的情况
