## Why

当前分镜编辑直接从聊天生成分镜，缺少“先定义人物形象”的显式步骤，导致角色形象不够稳定、可控性不足。需要在分镜前增加人物形象节点，并把 chatbox workflow 升级为“先人物、后分镜”的流程，确保每个分镜都携带形象元素。

## What Changes

- 在视频分镜编辑流程前置“人物形象节点”，用于创建与管理角色形象设定。
- 优化 chatbox 工作流为多阶段：人物形象生成 → 形象确认 → 分镜生成 → 分镜迭代。
- 分镜生成时强制注入已确认的人物形象元素，确保镜头提示词包含对应角色特征。
- 支持在 chatbox 中可视化当前形象约束，并允许用户修正后再生成分镜。
- 保持与现有 SSE 交互兼容，增加形象阶段的进度与确认反馈。

## Capabilities

### New Capabilities
- `character-node-prep`: 在分镜编辑前提供人物形象节点，支持形象创建、确认与编辑。

### Modified Capabilities
- `chatbox-storyboard`: 从单阶段分镜对话升级为“先人物后分镜”的多阶段 workflow，并在对话中持续展示形象状态。
- `director-guided-chat`: 增加人物形象阶段引导与确认策略，确保脚本/分镜生成基于已确认角色。
- `storyboard-character-consistency`: 将一致性约束来源扩展为“人物形象节点 + 对话修正”，并强制分镜包含形象元素。

## Impact

- 前端：`ProjectEditorPage`、`FlowEditor`、`ChatboxPanel`、节点组件与状态管理。
- 后端：LLM prompt 编排、draft 生成链路、角色档案来源与校验逻辑。
- 数据：草案/会话中增加人物形象节点关联信息。
- 规格：新增 `character-node-prep`，并更新现有 chatbox/director/consistency specs。
