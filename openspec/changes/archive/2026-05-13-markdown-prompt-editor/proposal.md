## Why

LLM 优化后的提示词输出为 Markdown 格式，但当前分镜面板的提示词输入框是纯文本 textarea，无法预览渲染效果。用户需要能在一屏内浏览完整提示词的大图景并精细编辑。

## What Changes

- 将分镜属性面板的提示词输入从纯文本 textarea 替换为 Markdown 编辑器（支持编辑/预览双模式）
- 新增"放大编辑"按钮，点击后弹出 Modal 提供更大的编辑空间
- 移除原有的 `Input.TextArea` 组件，使用 Markdown 编辑器组件替代

## Capabilities

### New Capabilities

- `markdown-shot-prompt`: 分镜提示词使用 Markdown 编辑器，支持实时预览和 Modal 放大编辑

### Modified Capabilities

- 无

## Impact

- **前端**: `ShotProperties.tsx` 的提示词区域改造；新增 `MarkdownEditor` 可复用组件
- **依赖**: 客户端新增 `@uiw/react-md-editor` 包（Markdown 编辑器）
