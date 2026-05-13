## Context

当前分镜属性面板使用 `Input.TextArea` 作为提示词输入框，纯文本显示。LLM 优化后的提示词已改为 Markdown 格式输出（含 `## 镜头描述`、`### 运镜说明` 等结构化内容），纯文本 textarea 无法展示渲染效果，也不便于长文编辑。

## Goals / Non-Goals

**Goals:**
- 将提示词输入替换为 Markdown 编辑器（编辑/预览双模式）
- 新增"放大编辑"按钮，弹出 Modal 全屏编辑
- 兼容现有的 prompt 存储和更新逻辑（不改变数据结构）
- 编辑器主题跟随应用的暗色风格

**Non-Goals:**
- 不引入复杂富文本编辑器（如 Quill、ProseMirror）
- 不改动后端 API 或数据模型
- 不替换其他分镜配置控件

## Decisions

**1. 使用 `@uiw/react-md-editor`**
- 理由：支持编辑/预览分屏、轻量、暗色主题、React 原生集成。包大小约 30KB，无额外 UI 框架依赖。
- 备选：`react-markdown` + 自定义 textarea — 需手写编辑器交互，成本高。

**2. 抽离 `MarkdownEditor` 可复用组件**
- 放在 `apps/client/src/components/` 下，方便其他页面复用（如项目全局风格提示词）。
- Props: `value`, `onChange`, `minHeight`

**3. Live Preview + 隐藏工具栏**
- 使用 `preview="live"` 同时显示编辑区和预览区，即编即览
- 通过 CSS 隐藏工具栏（`.w-md-editor-toolbar`），保持界面简洁

**4. Modal 放大编辑使用 Antd Modal**
- 点击"放大编辑"按钮打开 Modal，内部使用同一个 `MarkdownEditor` 组件
- Modal 内编辑和行内编辑器共享 state，即改即同步
- 保存后调用已有的 `update('prompt', ...)` 逻辑

## Risks / Trade-offs

- [包体积增加 ~30KB] → 可接受，仅为 UI 层依赖
- [编辑器与 antd 主题风格一致] → `@uiw/react-md-editor` 支持 `data-color-mode`，设为 `dark` 即可适配
