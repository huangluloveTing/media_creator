## Context

分镜流程卡片目前显示纯文本 prompt 截断（80 字符）。LLM 优化后提示词变为 Markdown，需要渲染展示。已生成视频的分镜应同时展示视频预览和提示词。

## Goals / Non-Goals

**Goals:**
- ShotCard 同时显示视频（如有）和 Markdown 渲染的提示词
- ShotNode 同时显示视频（如有）和 Markdown 渲染的提示词
- 视频 URL 用 `useEffect` 按需获取并缓存到组件 state

**Non-Goals:**
- 不改动后端 API
- 不需要改动任何数据模型

## Decisions

**1. 视频和提示词同时显示，不互斥**
- 生成完成时：卡片上方显示 video 缩略图，下方显示提示词的 Markdown 预览
- 未生成时：卡片显示 Markdown 渲染的提示词（占满内容区）
- 视频/提示词两者同时展示，不根据状态切换

**2. 按需获取视频 URL，不在全局状态中缓存**
- 每个 `ShotCard` / `ShotNode` 通过 `useEffect` + `getShotVideoUrl` 获取 URL
- 理由：视频 URL 有有效期（presigned URL），不适合存全局状态

**3. video 元素默认显示缩略图（静音、不自动播放），点击后播放**
- 默认状态：video 加载后停在首帧，显示播放按钮覆盖层
- 点击后：调用 `video.play()` 播放，播放中再次点击暂停
- 使用 `muted` 避免浏览器自动播放限制

**4. Markdown 预览使用 `MDEditor.Markdown` 直接渲染**
- 轻量，无需加载完整编辑器
- 暗色主题自动适配

## Risks / Trade-offs

- [视频 URL 过期] → 用户刷新页面可重新获取；发生 403 时自动重试
- [卡片空间有限] → 视频缩略图固定高度，提示词预览截断 2-3 行
