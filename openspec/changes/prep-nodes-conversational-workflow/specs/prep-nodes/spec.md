## ADDED Requirements

### Requirement: PrepNode 抽象层
系统 SHALL 提供可扩展的前置准备节点（PrepNode）抽象层，定义统一接口，支持在分镜容器前放置多种类型的前置节点。

#### Scenario: PrepNode 基类定义
- **WHEN** 系统定义 PrepNode 数据结构
- **THEN** PrepNode SHALL 包含 `id`、`type`、`status`、`order`、`data` 字段
- **AND** `type` SHALL 支持 `character`、`world_setting`、`story_outline` 三种枚举值

#### Scenario: PrepNode 在流程图中的位置
- **WHEN** 用户进入项目编辑页
- **THEN** 所有 PrepNode SHALL 放置在分镜容器前
- **AND** PrepNode 按 `order` 字段排序展示

### Requirement: 人物形象 PrepNode（Character 子类型）
系统 SHALL 提供人物形象节点作为 PrepNode 的子类型，支持在一个节点内定义多个角色形象。

#### Scenario: 创建多角色人物节点
- **WHEN** 用户创建人物形象 PrepNode
- **THEN** 节点 data SHALL 包含 `characters` 数组
- **AND** 每个角色 SHALL 包含 `name`、`appearance`、`outfit`、`traits`、`immutable` 字段

#### Scenario: 人物节点显示多角色摘要
- **WHEN** 人物节点包含多个角色
- **THEN** 节点在流程图中 SHALL 显示所有角色名称

### Requirement: 世界观设定 PrepNode（WorldSetting 子类型）
系统 SHALL 提供世界观设定节点，用于定义故事的时代背景、地点、氛围和规则。

#### Scenario: 创建世界观节点
- **WHEN** 用户创建世界观设定 PrepNode
- **THEN** 节点 data SHALL 包含 `era`、`location`、`atmosphere`、`rules`、`visualStyle` 字段

### Requirement: 故事梗概 PrepNode（StoryOutline 子类型）
系统 SHALL 提供故事梗概节点，用于定义故事前提、关键情节点和叙事调性。

#### Scenario: 创建故事梗概节点
- **WHEN** 用户创建故事梗概 PrepNode
- **THEN** 节点 data SHALL 包含 `premise`、`plotBeats`、`tone`、`targetShotCount` 字段
- **AND** `targetShotCount` SHALL 约束分镜生成的最大镜头数

### Requirement: PrepNode 可扩展性
系统 SHALL 允许在未来添加新的 PrepNode 子类型而不修改核心 PrepNode 抽象。

#### Scenario: 新增 PrepNode 子类型
- **WHEN** 未来需要新增 PrepNode 子类型
- **THEN** 只需定义新的 `type` 枚举值和对应的 `data` 结构
