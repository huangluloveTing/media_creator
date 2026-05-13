## Why

分镜流程卡片目前只显示纯文本提示词截断。LLM 优化后提示词变为 Markdown 格式，需要渲染展示。已生成视频的分镜应同时展示视频预览和提示词 Markdown 预览。

## What Changes

- `ShotsContainerNode` 的 `ShotCard`：同时显示视频（如有）和 Markdown 渲染的提示词
- `ShotNode`（流程图）：同时显示视频（如有）和 Markdown 渲染的提示词
- 视频 URL 从 `getShotVideoUrl` 异步获取

## Capabilities

### New Capabilities

- `shot-preview-in-card`: 分镜卡片同时显示视频预览和 Markdown 渲染的提示词

### Modified Capabilities

- 无

## Impact

- **前端**: `ShotsContainerNode.tsx`（ShotCard）、`ShotNode.tsx` 改造
- **API**: 复用已有 `getShotVideoUrl` 接口
