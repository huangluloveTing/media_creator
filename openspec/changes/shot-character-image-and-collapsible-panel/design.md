## Context

当前分镜编辑面板（`ShotProperties`）已包含提示词、镜头参数、生成参数、转场设置等功能区域。数据库 `Shot` 实体已预留 `characterRef` 字段，并在 `generation.worker.ts` 中拼接到 Seedance API 的 `referenceImages` 参数。但前端没有任何 UI 暴露此能力。同时，右侧面板以 `<fieldset>` 平铺所有设置区域，当内容增多时影响操作效率。

项目已集成 MinIO 用于视频存储，后端使用 NestJS + BullMQ，前端使用 React + Ant Design + React Flow。

## Goals / Non-Goals

**Goals:**
- 在 ShotProperties 面板新增"主形象"区域，用户可上传图片或通过大模型生成角色/IP 形象图
- 上传的图片存储到 MinIO，URL 写入 `shot.characterRef`，在生成时传递给 Seedance API
- 大模型生图通过后端新增 API 端点调用 LLM 图片能力实现
- 右侧面板的镜头参数、生成参数、转场区域支持折叠/展开，提示词区域始终展开

**Non-Goals:**
- 不涉及多个角色形象管理（仅支持单一主形象参考图）
- 不修改 Seedance API 的调用逻辑（`characterRef` 已有）
- 不改变面板的布局结构（宽度、位置不变）
- 不在本次变更中修改 StartProperties / MergeProperties / EdgeProperties 的折叠行为（后续可选优化）

## Decisions

### 1. 图片上传：复用 MinIO 存储，新增 `images` 模块

**选择**: 在后端新增 `ImageModule`，使用现有的 `StorageService`（MinIO）存储图片，key 前缀为 `images/`，内容类型为 `image/*`。

**备选**: 使用第三方图床（如 Imgur）→ 引入外部依赖，上传速度不可控。

**理由**: MinIO 已集成且稳定，视频存储模式可直接复用，数据自主可控。

### 2. 大模型生图：通过现有 LLM 接口扩展

**选择**: 复用现有的 LLM 配置（Settings 中的 LLM API Key/Base URL/Model），新增 `POST /llm/generate-image` 端点。如果 LLM 不支持图片生成，回退到提示词描述模式（将形象描述文本作为 `characterRef` 的一部分拼入 prompt）。

**备选**: 集成专门的图片生成服务（如 Stability AI、Midjourney API）→ 增加额外的 API Key 管理和成本。

**理由**: 复用已有 LLM 配置，减少用户设置负担。如果当前 LLM 模型不支持图片输出，则降级为纯文本处理。

### 3. 折叠组件：使用 Ant Design `Collapse`

**选择**: 使用 Ant Design 的 `Collapse` 组件实现折叠，设置 `ghost` 样式以匹配现有暗色主题，默认 `activeKey` 为所有面板 key（全部展开）。

**备选**: 手写折叠动画 → 增加维护成本，Ant Design Collapse 已满足需求。

**理由**: Ant Design 已在项目中广泛使用，`Collapse` 组件提供开箱即用的折叠/展开动画和无障碍支持。

### 4. 主形象 UI 布局

**选择**: 在提示词区域和镜头参数区域之间插入"主形象"区域。展示当前形象预览图（如有），提供"上传图片"按钮和"AI 生成"按钮。上传使用 Ant Design `Upload` 组件的拖拽模式。

**理由**: 主形象和提示词内容紧密相关，放在提示词下方符合用户编辑流程。

## Risks / Trade-offs

- **[大模型不支持图片生成]**: 当前 LLM API 可能不支持图片输出 → 降级方案：将形象的文字描述作为 `characterRef` 传递，或在 prompt 中拼接形象描述文本
- **[图片上传文件大小]**: 高分辨率图片影响上传速度和存储 → 前端限制 5MB，上传前压缩预览
- **[MinIO 图片访问]**: 需要 presigned URL 才能访问私有图片 → 复用现有 `getSignedUrl` 方法，前端通过 API 获取临时访问 URL
- **[折叠状态记忆]**: 用户切换分镜后面板折叠状态重置 → 使用组件本地 state，切换分镜后重置为默认展开（可接受行为）

## Open Questions

- LLM 服务商是否支持图片生成 API？需确认当前配置的 LLM 模型的图片生成能力
- 是否需要支持多张形象参考图？（当前 Seedance API 的 `referenceImages` 是数组，但本次仅支持单张）
