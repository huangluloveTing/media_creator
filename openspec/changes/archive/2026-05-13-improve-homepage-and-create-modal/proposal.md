## Why

首页创建项目的交互过于简单：只有一个输入框 + 按钮，仅能填写标题。创建后还需要进编辑页设置分辨率、帧率等信息，流程不合理。首页整体 UI 也需要优化以提升体验。

## What Changes

- 将创建项目改为 Modal 对话框，填写项目标题、分辨率、帧率、默认转场、全局风格提示词等
- 项目列表卡片显示更多信息（创建时间、镜头数、生成进度）
- 首页布局优化：header 更紧凑，项目列表间距调整
- 更新前端 API client 的 `createProject` 方法，支持传入所有项目参数

## Capabilities

### New Capabilities

- `create-project-modal`: 创建项目使用 Modal 表单，填写完整的视频参数

### Modified Capabilities

- 无

## Impact

- **前端**: `ProjectListPage.tsx` 重构（Modal 创建、列表优化）、`api/client.ts` 更新
- **后端**: 无需改动（`CreateProjectDto` 已支持所有字段）
