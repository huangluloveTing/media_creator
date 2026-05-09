## Why

当前没有一款工具将 AI 视频生成、分镜规则配置、流程可视化编辑和最终合并整合为单一工作流。创作者需要在多个工具间切换：用 AI 平台生成片段、用剪辑软件拼接、手动管理生成状态。Media Creator 提供统一的节点图界面，让创作者在一条线性流水线上完成从分镜构思到成片导出的全过程。

## What Changes

- **新增** React Flow 节点图编辑器，支持 Start → Shot × N → Merge 的线性流水线交互
- **新增** 分镜节点（Shot）的完整配置面板：提示词、镜头参数（景别/角度/运动）、内容约束、生成参数
- **新增** Seedance API 集成（火山引擎 Ark API），异步提交生成任务并轮询状态
- **新增** FFmpeg 合并服务，将多个生成片段按转场规则拼接，叠加 BGM 和字幕，输出最终视频
- **新增** 项目持久化管理（PostgreSQL），保存完整的项目配置和生成状态
- **新增** 画布小地图（Minimap），支持鸟瞰导航

## Capabilities

### New Capabilities

- `project-management`: 项目的创建、读取、更新、删除，全局设置管理（分辨率、帧率、默认转场、输出目录）。Start 节点承载这些设置。
- `node-graph-editor`: 基于 React Flow 的节点图编辑器。支持从面板拖入 Shot 节点、拖拽重排序、删除节点自动重连、点击节点/连线打开属性面板、画布缩放平移、Minimap 鸟瞰导航。
- `shot-configuration`: 分镜节点的配置与编辑。包括提示词、镜头参数（景别/角度/运动方式/时长）、内容约束（必须/禁止出现的元素）、生成参数（模型/分辨率/比例）。Edge 上承载转场类型、时长和字幕文案。
- `video-generation`: 对接 Seedance Ark API。提交生成任务、轮询任务状态、下载生成视频片段、提取最后一帧用于镜头衔接。每个 Shot 节点有独立的状态机：draft → queued → generating → completed/failed。
- `video-merge`: FFmpeg 合并流水线。按顺序拼接片段、应用转场效果、混入 BGM、叠加字幕、全局调色，输出最终视频文件。Merge 节点承载合并配置。

### Modified Capabilities

<!-- 无现有 capability 需要修改 -->

## Impact

- **前端**: 新增 React + TypeScript 应用，依赖 reactflow (@xyflow/react)、状态管理库
- **后端**: 新增 NestJS 服务，依赖 @nestjs/typeorm (PostgreSQL)、FFmpeg CLI
- **外部 API**: 火山引擎 Ark API (Seedance)，需要 API Key 认证
- **存储**: 本地磁盘存储生成视频和最终输出文件
- **基础设施**: 需本地安装 FFmpeg，本地或可访问的 PostgreSQL 实例
