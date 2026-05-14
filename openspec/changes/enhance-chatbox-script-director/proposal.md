## Why

当前左侧 chatbox 在复杂分镜场景下空间不足、对话引导较弱，且分镜中角色形象容易漂移，导致用户很难稳定产出“角色统一、脚本可控”的视频。需要把 chatbox 交互与系统提示词升级为“视频脚本导演”模式，提升创作一致性和可控性。

## What Changes

- 扩展编辑页左侧 chatbox 宽度，提升长对话与草案预览可读性。
- 增加“角色形象统一”分镜生成机制：在多轮迭代中抽取并固化角色设定，并在后续分镜生成时持续约束。
- 增强对话式分镜流程，增加关键确认步骤（角色、风格、节奏、镜头目标）与更多中间反馈，确保输出更贴近用户意图。
- 重构分镜生成系统提示词，采用“视频脚本专家/分镜导演”角色，强化叙事能力与结构化输出稳定性。
- 在流式生成过程中返回更丰富的交互状态（如阶段提示、约束确认、草案摘要），提升可解释性。

## Capabilities

### New Capabilities
- `storyboard-character-consistency`: 维护并应用跨镜头角色一致性约束，支持多轮对话中角色设定沉淀与复用。
- `director-guided-chat`: 以“视频脚本导演”角色驱动对话式分镜，增加关键交互节点与澄清问答。

### Modified Capabilities
- `chatbox-storyboard`: 扩展 chatbox 布局宽度与流式交互内容，提升分镜生成可读性与过程反馈。

## Impact

- 前端：`ProjectEditorPage`、`ChatboxPanel` 的布局与交互逻辑。
- 后端：LLM prompt 编排、SSE 事件模型、draft 生成流程。
- 规格：新增角色一致性与导演式交互能力 specs，更新现有 chatbox-storyboard spec。
