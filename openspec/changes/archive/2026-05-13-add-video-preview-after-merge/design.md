## Context

当前合成流程：用户点击"合成导出" → 后端执行 FFmpeg merge → 上传到 MinIO → 返回 `{ ok: true, url: presignedUrl }`。但前端 MergeProperties 组件只在 `project.status === 'completed'` 时显示绿色的"导出完成"提示，没有嵌入视频播放器。

后端已经提供 `GET /projects/:id/final-video` 接口用于获取 final video 的 presigned URL。

## Goals / Non-Goals

**Goals:**
- 合成完成后在 MergeProperties 面板嵌入 `<video>` 播放器，用户可直接预览
- 修复前端 API client 对 merge 响应的类型定义（`outputPath` → `url`）
- 已完成的合并在重新打开项目时自动加载并显示视频预览
- 提供重新合成按钮

**Non-Goals:**
- 不修改后端逻辑（已有 `final-video` 端点可用）
- 不做视频下载功能（可用浏览器默认右键保存）

## Decisions

### 1. 使用已有 `getProjectFull` 加载 finalVideoKey
- 通过 `ProjectContext` 中的 `state.project.finalVideoKey` 判断是否有历史合成结果
- 已有 `finalVideoKey` 且 project status 为 `completed` 时，调用 `GET /projects/:id/final-video` 获取 presigned URL

### 2. 使用 `<video>` 标签 + Ant Design Spin
- 直接使用原生 `<video controls>` 标签，不需要额外依赖
- 加载时用 Ant Design `<Spin>` 显示 loading 状态
- 视频区域设置宽高比，适配面板布局

### 3. 新增 `getFinalVideoUrl` API 方法
- 类似 `getShotVideoUrl`，封装 `GET /projects/:id/final-video` 调用
- 返回 presigned URL 字符串

## Risks / Trade-offs

- **Presigned URL 过期**（默认 1 小时）→ 用户如需预览更长时间的视频，可重新进入项目触发刷新
- **视频大小** → 使用 Ant Design 的 Spin 组件在加载时显示 loading，避免空白
