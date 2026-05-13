## ADDED Requirements

### Requirement: 分镜提示词使用 Markdown 编辑器（纯编辑态）
系统 SHALL 在分镜属性面板中使用 Markdown 编辑器替代纯文本 textarea，仅显示编辑区，不显示预览区和工具栏。

#### Scenario: 显示已保存的提示词
- **WHEN** 用户选中一个分镜
- **THEN** 提示词区域显示 Markdown 编辑器的纯编辑视图，内容为该分镜已保存的提示词

#### Scenario: 直接编辑
- **WHEN** 用户在编辑区输入或修改 Markdown 文本
- **THEN** 编辑区内容实时更新

#### Scenario: 无工具栏
- **WHEN** 面板中的 Markdown 编辑器被渲染
- **THEN** 工具栏不显示，仅保留纯编辑区

#### Scenario: 失焦保存
- **WHEN** 用户在编辑器中完成修改后点击其他区域
- **THEN** 系统自动保存提示词（调用 update API）

#### Scenario: 暗色主题一致
- **WHEN** 编辑器被渲染
- **THEN** 编辑器视觉风格与当前应用的暗色主题一致

### Requirement: 支持 Modal 放大编辑（带工具栏）
系统 SHALL 提供"放大编辑"按钮，点击后弹出 Modal 在更大的空间内编辑提示词，Modal 中显示完整工具栏。

#### Scenario: 弹出 Modal 编辑
- **WHEN** 用户点击"放大编辑"按钮
- **THEN** 弹出 Modal，包含同款 Markdown 编辑器（纯编辑态，带格式工具栏），尺寸占屏幕大部分区域

#### Scenario: 行内和 Modal 编辑同步
- **WHEN** 用户在 Modal 中修改提示词后点击确定
- **THEN** 行内编辑器的内容同步更新

#### Scenario: 取消不保存
- **WHEN** 用户在 Modal 中点击取消
- **THEN** Modal 关闭，行内编辑器内容不变
