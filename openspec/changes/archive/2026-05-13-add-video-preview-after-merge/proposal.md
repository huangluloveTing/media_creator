## Why

当前视频合成（merge）完成后，用户只看到一个"导出完成"的提示，无法在页面内直接预览合成结果。用户需要回到项目列表或通过其他方式查看视频，体验不连贯。

## What Changes

- 合成完成后，在 MergeProperties 面板中直接显示视频播放器，用户可立即预览
- 修复前端 API 客户端对 merge 响应的类型定义（当前为 `outputPath`，实际后端返回 `url`）
- 已完成的合并在重新打开项目时，MergeProperties 面板自动显示历史合成视频预览
- 提供重新合成按钮，方便用户调整参数后再次合成

## Capabilities

### New Capabilities
- `video-preview`: 视频合成后的预览能力，包括 merge 完成后的即时预览和已有合成结果的回顾预览

### Modified Capabilities

<!-- No existing specs need modification -->

## Impact

- **Frontend**: `MergeProperties.tsx` — 新增视频播放组件；`api/client.ts` — 修复 merge 响应类型
- **Backend**: `GET /projects/:id/final-video` 已存在且可用，无需修改
