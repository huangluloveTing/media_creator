## ADDED Requirements

### Requirement: Collapsible sections in shot properties panel

在分镜编辑面板（`ShotProperties`）中，提示词区域以外的设置区域 SHALL 支持折叠/展开。提示词区域 MUST 始终展开不可折叠。

#### Scenario: Default state - all sections expanded

- **WHEN** 用户打开分镜编辑面板
- **THEN** 镜头参数、生成参数、转场到下一镜三个区域均默认展开

#### Scenario: Collapse a section

- **WHEN** 用户点击某个设置区域的标题（如"镜头参数"）
- **THEN** 该区域的内容折叠隐藏，标题旁显示展开图标指示

#### Scenario: Expand a collapsed section

- **WHEN** 用户点击已折叠区域的标题
- **THEN** 该区域的内容展开显示

#### Scenario: Prompt section never collapses

- **WHEN** 用户查看分镜编辑面板
- **THEN** 提示词区域始终完整显示，无折叠按钮

#### Scenario: Switching between shots resets collapse state

- **WHEN** 用户从分镜 A 切换到分镜 B
- **THEN** 面板中所有区域重置为默认展开状态
