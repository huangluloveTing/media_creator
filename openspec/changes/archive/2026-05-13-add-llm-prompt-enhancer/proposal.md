## Why

当前配置页面只支持 Seedance API Key，用户在编写分镜提示词时需要手动优化，缺乏 AI 辅助。增加 LLM 配置并在提示词编辑时提供一键优化功能，可以显著提升创作效率。

## What Changes

- 在配置页面新增 LLM 配置卡片（支持配置 provider、API Key、model、base URL）
- 在分镜属性面板的提示词输入框旁增加"AI 优化"按钮，调用 LLM 对提示词进行改写增强
- 后端新增 LLM 配置存储（复用 settings 表）及提示词增强 API 端点

## Capabilities

### New Capabilities

- `llm-settings`: 在配置页面管理 LLM provider 配置（API Key、model、base URL）
- `prompt-enhancer`: 在分镜提示词编辑区提供 LLM 驱动的提示词改写功能

### Modified Capabilities

- `video-preview`: 无需求变更

## Impact

- **前端**: `SettingsPage.tsx` 新增 LLM 配置卡片；`ShotProperties.tsx` 提示词区域新增优化按钮
- **后端**: `settings` 模块新增 LLM 相关 key 的读写；新增 `llm` 模块提供 `/llm/enhance-prompt` 端点
- **依赖**: 后端新增 OpenAI-compatible SDK（`openai` npm 包）用于调用 LLM
