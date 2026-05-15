## MODIFIED Requirements

### Requirement: 分镜编辑前的人物形象节点
系统 SHALL 在视频分镜编辑流程中提供人物形象 PrepNode，作为 PrepNode 抽象层的子类型，支持通过对话和表单两种方式定义角色形象，一个节点内可定义多个角色。

#### Scenario: 创建人物形象节点
- **WHEN** 用户进入项目编辑页并准备开始分镜
- **THEN** 系统在 FlowEditor 中展示人物形象 PrepNode（位于分镜容器前）
- **AND** 若项目无任何 prep 节点则 Chatbox 首次对话时自动创建
- **AND** 用户可通过 Chatbox 对话或节点属性面板填写角色信息
- **AND** 一个节点 SHALL 支持定义多个角色

#### Scenario: 通过属性面板编辑并保存人物形象节点
- **WHEN** 用户在节点属性面板修改人物形象节点内容
- **THEN** 系统通过 `PUT /projects/:id` 保存并更新当前项目的 prepNodes 配置
- **AND** 修改后节点状态重置为 drafting

### Requirement: 人物形象确认门控
系统 SHALL 在人物形象未确认时将用户消息路由到 prep 对话流程。

#### Scenario: 形象未确认时发送消息
- **WHEN** 用户未确认人物形象即发送消息
- **THEN** 系统 SHALL 路由到 `POST /llm/prep/stream` 进行选角导演式对话
- **AND** 不执行分镜生成

#### Scenario: 自然语言确认人物形象
- **WHEN** 用户说"确认人物形象"或"可以了"等确认意图
- **THEN** 系统 SHALL 将人物形象 prep 节点标记为 confirmed
- **AND** 在 Chatbox 中展示确认消息
