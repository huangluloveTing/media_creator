## 1. 后端: LLM 模块基础

- [x] 1.1 在 `apps/server` 安装 `openai` npm 包
- [x] 1.2 创建 `llm` NestJS 模块（module、service、controller）
- [x] 1.3 将 `llm` 模块注册到 `app.module.ts`

## 2. 后端: LLM 配置存取

- [x] 2.1 实现 `SettingsService` 中 LLM 配置的读写（key 前缀 `llm.`）
- [x] 2.2 确保配置页 API 能返回 LLM 相关配置（provider 区分）

## 3. 后端: 提示词增强端点

- [x] 3.1 实现 `POST /llm/enhance-prompt` 端点
- [x] 3.2 调用 OpenAI-compatible API 改写提示词（构造 system prompt + user prompt）
- [x] 3.3 处理 LLM 未配置错误、调用超时等异常情况

## 4. 前端: 配置页新增 LLM 配置卡片

- [x] 4.1 `SettingsPage.tsx` 新增 LLM 配置卡片（API Key、model、base URL）
- [x] 4.2 支持从 settings API 加载/保存 LLM 配置
- [x] 4.3 API Key 脱敏显示，空值校验

## 5. 前端: 分镜提示词 AI 优化按钮

- [x] 5.1 `ShotProperties.tsx` 提示词区域新增"AI 优化"按钮
- [x] 5.2 调用 `/llm/enhance-prompt` 接口
- [x] 5.3 loading 状态、空提示词禁用、错误处理
- [x] 5.4 优化完成后替换 textarea 内容
