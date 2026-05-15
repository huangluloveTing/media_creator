## Why

当前人物形象节点只能通过表单手动填写，缺少 LLM 驱动的对话式创建能力。用户需要在 Chatbox 中通过自然语言描述、多轮追问迭代来生成人物形象及其他创作前置要素（世界观、故事梗概），而非填表。同时，单一的人物节点无法满足"多种前置节点类型"的需求——需要在分镜前建立可扩展的 PrepNode 抽象层。

## What Changes

- 设计可扩展的 **PrepNode 抽象层**，支持人物形象 (Character)、世界观设定 (WorldSetting)、故事梗概 (StoryOutline) 三种节点类型，未来可扩展。
- 将人物形象节点从独立表单模式重构为 PrepNode 子类型，**一个节点内支持多个人物定义**。
- Chatbox 升级为**对话驱动的 prep 创建引擎**：LLM 根据当前 prep 节点类型动态切换角色（选角导演 / 世界观设计师 / 故事编剧），通过多轮追问生成结构化 prep 数据。
- 实现**同一 Chatbox 内自然流转**：用户可通过下拉切换或自然语言指令在多个 prep 节点间跳转，确认全部 prep 后自动进入分镜阶段。
- 分镜生成时注入**所有已确认 prep 节点的约束**（不只是人物形象），确保世界观、故事线与角色一致地作用于分镜输出。

## Capabilities

### New Capabilities
- `prep-nodes`: 可扩展的前置节点抽象层，定义 PrepNode 基类及 Character / WorldSetting / StoryOutline 三种子类型。节点置于 FlowEditor 分镜容器前，支持可视化回显与手动微调。
- `conversational-prep-creation`: Chatbox 中 LLM 驱动的对话式 prep 节点创建，支持多轮追问迭代、结构化提取、确认回写。

### Modified Capabilities
- `character-node-prep`: 从单一表单编辑改为 PrepNode 子类型，支持一个节点内定义多个角色，以对话为主要创建方式、节点面板为辅助编辑。
- `chatbox-storyboard`: 状态机从 `character_drafting→character_confirmed→storyboard` 升级为 `prep_drafting→prep_confirmed→storyboard`，增加 prep 节点切换感知和导航。
- `director-guided-chat`: System prompt 从固定"分镜导演"升级为根据当前 prep 节点类型动态切换的 phase-aware 角色系统。
- `storyboard-character-consistency`: 约束来源从单一人物形象节点扩展为所有已确认 prep 节点，分镜生成时注入完整 prep 上下文。

## Impact

- 前端：`ChatboxPanel`、`FlowEditor`、`CharacterNode`、`CharacterProperties`、`PropertiesPanel`、`ProjectContext`
- 后端：`StoryboardService`、`LlmService`、LLM prompt 编排、draft schema
- 数据：`Project` 增加 `prepNodes` 字段，`CharacterProfile` 扩展为多角色数组
- 规格：新增 `prep-nodes`、`conversational-prep-creation`，修改 `character-node-prep`、`chatbox-storyboard`、`director-guided-chat`、`storyboard-character-consistency`
