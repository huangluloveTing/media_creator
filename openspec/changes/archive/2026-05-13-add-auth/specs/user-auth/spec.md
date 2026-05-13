## ADDED Requirements

### Requirement: 用户登录
系统 SHALL 提供用户名/密码登录接口，验证通过后返回 JWT token。

#### Scenario: 登录成功
- **WHEN** 用户 POST `/api/auth/login` 提供正确的用户名和密码
- **THEN** 返回 `{ token: string }`，token 为有效的 JWT

#### Scenario: 登录失败
- **WHEN** 用户提供错误的用户名或密码
- **THEN** 返回 401 状态码及错误信息

### Requirement: JWT 鉴权保护 API
系统 SHALL 对所有 API 路由进行 JWT 鉴权，除登录/注册接口外。

#### Scenario: 请求带有效 token
- **WHEN** 请求头包含 `Authorization: Bearer <valid-token>`
- **THEN** 接口正常返回数据

#### Scenario: 请求无 token
- **WHEN** 请求头不包含 Authorization
- **THEN** 返回 401 状态码

#### Scenario: 请求带过期 token
- **WHEN** 请求头包含过期或无效的 token
- **THEN** 返回 401 状态码

#### Scenario: 公开接口无需 token
- **WHEN** 请求标记为 `@Public()` 的路由（如 `/api/auth/login`）
- **THEN** 无需 token 即可访问

### Requirement: 修改密码
系统 SHALL 提供修改密码功能，用户需提供旧密码验证。

#### Scenario: 修改密码成功
- **WHEN** 已登录用户 PUT `/api/auth/password` 提供正确的旧密码和新密码
- **THEN** 密码更新成功，返回成功响应

#### Scenario: 旧密码错误
- **WHEN** 用户提供错误的旧密码
- **THEN** 返回 400 错误及提示

### Requirement: 登录页面
系统 SHALL 提供登录页面，用户输入用户名密码后登录并跳转到首页。

#### Scenario: 登录成功跳转
- **WHEN** 用户填写正确凭据并提交
- **THEN** 页面跳转到项目列表页，token 保存到 localStorage

#### Scenario: 登录失败显示错误
- **WHEN** 用户填写错误凭据
- **THEN** 页面显示错误提示（不跳转）

#### Scenario: 未登录自动跳转
- **WHEN** 未登录用户访问受保护页面
- **THEN** 自动跳转到 `/login`

### Requirement: 修改密码页面
系统 SHALL 提供修改密码页面，已登录用户可修改自己的密码。

#### Scenario: 修改密码成功
- **WHEN** 用户输入正确的旧密码和新密码并提交
- **THEN** 显示成功提示

#### Scenario: 旧密码错误
- **WHEN** 用户输入错误的旧密码
- **THEN** 显示错误提示
