## Context

当前项目已有 `settings` 模块（key-value 存储）和 `seedance` 模块（视频生成）。配置页面只支持 Seedance API Key。需要扩展为支持 LLM 配置，并在分镜提示词编辑时提供 AI 增强能力。

## Goals / Non-Goals

**Goals:**
- 在 settings 表中存储 LLM 配置（provider、API Key、model、base URL）
- 新增后端 `/llm/enhance-prompt` 端点，调用 LLM 改写提示词
- 前端配置页新增 LLM 配置卡片
- 分镜属性面板提示词区域新增"AI 优化"按钮

**Non-Goals:**
- 不支持多个 LLM provider 同时配置（只存一套活跃配置）
- 不做 LLM 流式响应（单次请求/响应即可）
- 不替换 Seedance 生成流程

## Decisions

**1. LLM 调用使用 `openai` npm 包（OpenAI-compatible）**
- 理由：大多数 LLM provider（OpenAI、DeepSeek、Qwen 等）都兼容 OpenAI API 格式，用 `openai` 包 + 自定义 `baseURL` 可覆盖主流 provider，无需为每个 provider 单独集成。
- 备选：直接用 `fetch` 调用 HTTP API — 更轻量但需手写每个 provider 的差异。

**2. LLM 配置复用 settings 表，key 前缀为 `llm.`**
- 存储 key：`llm.apiKey`、`llm.model`、`llm.baseUrl`
- 理由：无需新建表，与现有 Seedance 配置模式一致。

**3. 新建独立 `llm` NestJS 模块**
- 理由：职责分离，settings 模块只管存储，llm 模块负责调用逻辑。
- 提供单一端点 `POST /llm/enhance-prompt`，接收 `{ prompt: string }` 返回 `{ result: string }`。

**4. 前端提示词优化为原地替换**
- 点击"AI 优化"后，loading 状态，完成后直接替换 textarea 内容，用户可继续编辑。

## Risks / Trade-offs

- [LLM 未配置时调用] → 端点返回 400 错误，前端展示友好提示"请先在配置页配置 LLM"
- [LLM 调用超时/失败] → 前端展示错误 message，不影响原有提示词内容
- [openai 包版本] → 锁定具体版本（^4.x）避免 breaking change
