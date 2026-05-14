## Why

分镜生成时缺少主形象参考，导致生成的视频人物或IP形象不一致。目前 `characterRef` 字段已在数据库和 Seedance API 中预留，但没有任何 UI 入口让用户设置参考形象。同时，右侧属性面板的所有设置项平铺展开，内容较长时需要频繁滚动，影响编辑效率。

## What Changes

- 分镜编辑面板新增"主形象"区域，支持两种方式设置角色/IP参考图：**本地上传图片** 和 **大模型生成图片**
- 新增图片上传 API（存储到 MinIO）和大模型生图 API（调用 LLM 图片生成能力）
- 图片上传组件支持拖拽/点击上传、预览、删除
- 右侧属性面板的**镜头参数**、**生成参数**、**转场到下一镜**三个区域改为可折叠展示，仅**提示词**区域始终展开

## Capabilities

### New Capabilities
- `shot-character-image`: 分镜主形象管理 — 支持上传图片或大模型生成图片作为分镜角色/IP参考图，存储 `characterRef` 并传递给 Seedance API
- `collapsible-panel-sections`: 右侧面板可折叠区域 — 属性面板中除提示词外的设置区域支持点击标题折叠/展开，默认展开

### Modified Capabilities
<!-- None: no existing spec-level behavior is being changed -->

## Impact

- **前端**: `ShotProperties.tsx` — 新增主形象区域、添加折叠组件；`StartProperties.tsx` / `MergeProperties.tsx` / `EdgeProperties.tsx` — 可选应用折叠
- **后端**: 新增图片上传模块（MinIO 存储）、新增 LLM 生图 API 端点
- **共享类型**: `Shot` 类型的 `characterRef` 字段已有，无需修改
- **依赖**: 需确认 LLM 服务商支持图片生成 API（如图生文模型或 DALL-E 类接口）
