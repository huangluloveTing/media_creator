## ADDED Requirements

### Requirement: 用户可用 LLM 优化分镜提示词
系统 SHALL 在分镜属性面板提供"AI 优化"按钮，调用 LLM 对当前提示词进行改写增强。

#### Scenario: 成功优化提示词
- **WHEN** 用户在提示词输入框有内容时点击"AI 优化"
- **THEN** 系统调用 `/llm/enhance-prompt`，完成后将返回结果替换当前提示词内容

#### Scenario: 优化中显示 loading 状态
- **WHEN** 用户点击"AI 优化"后请求进行中
- **THEN** 按钮显示 loading 状态，输入框禁用

#### Scenario: LLM 未配置时提示用户
- **WHEN** 用户点击"AI 优化"但后端返回 400（LLM 未配置）
- **THEN** 系统显示错误提示"请先在配置页配置 LLM"

#### Scenario: 提示词为空时禁用按钮
- **WHEN** 提示词输入框为空
- **THEN** "AI 优化"按钮保持禁用状态

### Requirement: 后端提供提示词增强端点
系统 SHALL 提供 `POST /llm/enhance-prompt` 端点，接收提示词并返回 LLM 改写结果。

#### Scenario: 成功调用 LLM
- **WHEN** 请求体包含非空 `prompt` 且 LLM 已配置
- **THEN** 端点返回 `{ result: string }` 包含改写后的提示词

#### Scenario: LLM 未配置时返回错误
- **WHEN** settings 中 `llm.apiKey` 为空
- **THEN** 端点返回 400 错误，message 为 "LLM not configured"
