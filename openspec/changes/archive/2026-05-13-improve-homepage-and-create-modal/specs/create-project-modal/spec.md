## ADDED Requirements

### Requirement: 创建项目使用 Modal 表单
系统 SHALL 使用 Modal 对话框创建项目，收集完整的项目参数。

#### Scenario: 打开创建 Modal
- **WHEN** 用户点击"创建项目"按钮
- **THEN** 弹出 Modal，包含标题、分辨率、帧率、默认转场、全局风格提示词字段

#### Scenario: 创建成功
- **WHEN** 用户填写标题等字段并提交
- **THEN** 项目创建成功，Modal 关闭，列表刷新

#### Scenario: 标题为空时禁用提交
- **WHEN** 用户未填写标题
- **THEN** 提交按钮禁用

### Requirement: 项目列表显示更多信息
系统 SHALL 在项目卡片中显示分辨率、帧率、镜头数、创建时间等信息。

#### Scenario: 列表展示
- **WHEN** 用户浏览项目列表
- **THEN** 每个卡片显示标题、视频参数、镜头数、创建时间、状态
