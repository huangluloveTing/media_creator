## ADDED Requirements

### Requirement: 用户可配置 LLM provider 信息
系统 SHALL 允许用户在配置页面保存 LLM 的 API Key、model 名称和 base URL。

#### Scenario: 保存 LLM 配置
- **WHEN** 用户在配置页填写 API Key、model、base URL 并点击保存
- **THEN** 系统将三个值分别以 `llm.apiKey`、`llm.model`、`llm.baseUrl` 为 key 存入 settings 表

#### Scenario: 加载已有 LLM 配置
- **WHEN** 用户打开配置页
- **THEN** 系统显示已保存的 model 和 base URL（API Key 脱敏显示）

#### Scenario: API Key 未填写时禁止保存
- **WHEN** 用户未填写 API Key 点击保存
- **THEN** 保存按钮保持禁用状态
