## Context

首页创建项目仅通过一个输入框 + 按钮完成，只能填标题。后端 `CreateProjectDto` 其实已支持 `resolution`、`fps`、`defaultTransitionType`、`defaultTransitionDuration`、`globalStylePrompt` 等字段，但前端未使用。

## Goals / Non-Goals

**Goals:**
- 创建项目改为 Modal 对话框
- Modal 内包含：标题、分辨率选择、帧率选择、默认转场、全局风格提示词
- 项目列表卡片显示更多信息（镜头数、创建时间、视频参数）
- 首页布局和空状态优化

**Non-Goals:**
- 不改动后端 API 和数据模型
- 不涉及编辑页功能修改

## Decisions

**1. 使用 Antd Modal + Form 组件**
- Modal 内用 `Form` 管理字段：`title`（必填）、`resolution`（默认 1920x1080）、`fps`（默认 24）、`defaultTransitionType`（默认 dissolve）、`globalStylePrompt`（可选 textarea）
- 分辨率选项：1920x1080, 1080x1920, 3840x2160 等常用参数
- 帧率选项：24, 25, 30

**2. 项目卡片增加信息展示**
- 卡片显示：标题、分辨率@fps、镜头数、创建时间、状态标签
- 删除按钮保留

**3. 布局微调**
- header 的用户菜单保留
- 空状态引导文案更新

## Risks / Trade-offs

- 无（纯前端改动，后端完全兼容）
