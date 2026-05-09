## Context

Media Creator 是一个全新的视频生成工具，将 AI 视频生成（Seedance）、分镜规则配置和 FFmpeg 合并整合为统一的节点图工作流。项目从零开始，无现有代码或架构约束。

用户通过 React Flow 节点图编辑一条线性流水线：Start → Shot × N → Merge。每个 Shot 节点配置提示词、镜头参数、内容约束和生成参数。后端通过 Seedance Ark API 异步生成视频片段，前端轮询状态。所有片段完成后，FFmpeg 按照 Edge 上定义的转场规则拼接片段并叠加 BGM/字幕。

## Goals / Non-Goals

**Goals:**
- 提供 Figma 式的节点图编辑器用于视频流水线编辑
- 集成 Seedance Ark API，支持文本生成视频、首帧图引导、最后一帧提取
- FFmpeg 拼接片段，支持 dissolve/cut/fade/wipe 转场
- 分镜粒度的生成状态实时反馈
- 项目数据持久化到 PostgreSQL

**Non-Goals:**
- 不实现多用户/权限系统（单用户工具）
- 不支持分支或并行流水线（仅线性）
- 不内置视频预览播放器（使用浏览器原生 video 标签）
- 不实现实时协作编辑
- 不对接 OSS/云存储（仅本地磁盘）

## Decisions

### 1. React Flow (@xyflow/react) 作为节点编辑器

**选择**: @xyflow/react v12+
**备选**: 自建 Canvas/React-Konva、Node-RED 前端 SDK

React Flow 是唯一成熟的 React 节点编辑器库，内置节点拖拽、连线交互、Minimap、自定义节点渲染、自定义 Edge 标签。自建成本过高且不必要。v12 有 breaking changes 但 API 更清晰，值得直接使用最新版。

### 2. NestJS 后端架构

采用 NestJS 模块化架构：

```
AppModule
├── ProjectModule      - 项目 CRUD
├── ShotModule         - 分镜 CRUD + 状态管理
├── SeedanceModule     - Seedance API 封装（提交/轮询/下载）
├── FFmpegModule       - FFmpeg CLI 封装（拼接/转场/音频/字幕）
└── StorageModule      - 本地文件管理
```

每个 Module 包含 Controller + Service + DTO。SeedanceService 和 FFmpegService 是独立服务，由 ShotModule 和 ProjectModule 调用。

### 3. 数据库设计：PostgreSQL + TypeORM

**核心表**:

```
projects
  id: UUID (PK)
  title: VARCHAR
  resolution: VARCHAR (e.g. "1920x1080")
  fps: INTEGER (e.g. 24)
  default_transition_type: VARCHAR
  default_transition_duration: FLOAT
  global_style_prompt: TEXT
  output_dir: VARCHAR
  status: VARCHAR (draft/generating/ready_to_merge/merging/completed)
  created_at / updated_at: TIMESTAMP

shots
  id: UUID (PK)
  project_id: UUID (FK → projects)
  order: INTEGER (在流水线中的位置)
  prompt: TEXT
  shot_size: VARCHAR (extreme-wide/wide/medium/close-up/extreme-close-up)
  angle: VARCHAR (eye-level/low/high/dutch/aerial)
  movement: VARCHAR (static/pan/tilt/dolly/zoom/handheld)
  duration: FLOAT
  required_elements: TEXT[] (数组)
  forbidden_elements: TEXT[]
  character_ref: VARCHAR (文件路径)
  scene_ref: VARCHAR (文件路径)
  model: VARCHAR (seedance-2.0/seedance-2.0-fast/seedance-1.5-pro)
  aspect_ratio: VARCHAR
  resolution: VARCHAR
  created_at / updated_at: TIMESTAMP

edges
  id: UUID (PK)
  project_id: UUID (FK → projects)
  source_shot_id: UUID (FK → shots, nullable for Start→Shot)
  target_shot_id: UUID (FK → shots, nullable for Shot→Merge)
  transition_type: VARCHAR
  transition_duration: FLOAT
  subtitle_text: TEXT
  position: INTEGER (edge 在流水线中的位置)

generation_tasks
  id: UUID (PK)
  shot_id: UUID (FK → shots, unique)
  task_id: VARCHAR (Seedance task ID)
  status: VARCHAR (draft/queued/generating/completed/failed)
  progress: INTEGER (0-100)
  video_url: TEXT (Seedance 返回的临时 URL)
  local_path: VARCHAR (下载到本地的路径)
  last_frame_path: VARCHAR (最后一帧截图路径)
  error_message: TEXT
  created_at / updated_at: TIMESTAMP
```

### 4. Seedance API 集成模式

```
Submit:
  POST ark.cn-beijing.volces.com/api/v3/contents/generations/tasks
  携带 prompt + 模型参数 + 可选 reference_image
  → 返回 task_id

Poll:
  GET .../tasks/{task_id}
  → status: queued | running | succeeded | failed
  → 间隔 3 秒轮询

Download:
  task 完成后获取 video_url
  → 下载到本地 /tmp/media_creator/{project_id}/{shot_order}.mp4
  → 提取 last_frame 保存为 {shot_order}_lastframe.png
```

Seedance API Key 通过环境变量 `SEEDANCE_API_KEY` 注入。

### 5. FFmpeg 合并流水线

```
输入: [shot_1.mp4, shot_2.mp4, ..., shot_n.mp4] + bgm.mp3

Step 1 - 拼接 + 转场:
  ffmpeg concat demuxer + xfade filter
  根据 edges 表的 transition_type 和 duration 生成 filter_complex

Step 2 - 音频:
  混入 BGM (音量可调: bgm_volume, original_volume)
  如 Seedance 片段自带音频，按配置混合或替换

Step 3 - 字幕:
  从 edges 表提取 subtitle_text
  用 drawtext filter 或 SRT subtitle 叠加

Step 4 - 输出:
  {output_dir}/{project_title}_final.mp4
```

### 6. 状态轮询策略

前端每隔 3 秒调用 `GET /api/projects/:id/shots` 获取所有 Shot 状态。
后端 ShotService 在 submit 后启动一个后台轮询器（setInterval），更新 generation_tasks 表。
前端仅做展示层轮询，不直接调 Seedance API。

### 7. 前端状态管理

使用 React Context + useReducer，不使用 Redux（单项目编辑场景足够）：

```
ProjectContext
  ├── nodes: Node[]        (React Flow 节点)
  ├── edges: Edge[]        (React Flow 连线)
  ├── selectedElement: Node | Edge | null
  └── isGenerating: boolean
```

### 8. 前端组件树

```
App
├── FlowEditor (React Flow canvas)
│   ├── StartNode (自定义节点)
│   ├── ShotNode (自定义节点，含状态图标)
│   ├── MergeNode (自定义节点)
│   └── ConnectionEdge (自定义 Edge，含转场标签)
├── NodePalette (可拖入 Shot 节点的面板)
├── PropertiesPanel (根据 selectedElement 切换)
│   ├── StartProperties
│   ├── ShotProperties
│   ├── EdgeProperties
│   └── MergeProperties
└── Minimap (React Flow 内置)
```

## Risks / Trade-offs

- **Seedance API 可用性**: Ark API 可能限流或变更 → 封装 SeedanceService 接口，未来可切换其他 API
- **FFmpeg 进程管理**: 长时间合并可能阻塞 → 使用 child_process.spawn 异步执行，限制并发数
- **大文件存储**: 10 个 1080p 片段 + 成品可能占 2-5GB → 提供清理策略（项目完成后可选删除中间文件）
- **React Flow v12 稳定性**: v12 较新，API 可能有变 → 锁定版本，不自动升级 minor
