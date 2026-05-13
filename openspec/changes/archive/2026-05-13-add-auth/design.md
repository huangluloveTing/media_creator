## Context

当前应用无认证。所有 API 端点公开可访问，页面无需登录。需要建立完整的 JWT 认证体系，包括密码修改功能。

## Goals / Non-Goals

**Goals:**
- 后端 JWT token 签发（用户名/密码登录）
- JWT guard 保护所有 API 路由（除 `/api/auth/login`、`/api/auth/register`）
- 修改密码端点（需旧密码验证）
- 前端登录页面
- 前端修改密码页面
- token 存储在 localStorage，API 请求自动携带
- 未登录时跳转到登录页
- 首次运行时创建默认管理员账号

**Non-Goals:**
- 不实现 OAuth / 第三方登录
- 不做细粒度角色权限（仅区分已登录/未登录）
- 不实现密码重置邮箱流程

## Decisions

**1. 使用 `@nestjs/jwt` + `passport-jwt` 策略**
- 理由：NestJS 官方支持，与框架深度集成，自动从 request 提取 token 验证
- 密码哈希使用 `bcrypt`

**2. 用户表使用 TypeORM Entity**
- `users` 表：id, username, password (bcrypt hash), createdAt, updatedAt
- 服务启动时如无用户则自动创建默认管理员

**3. 全局 Guard + 白名单**
- 使用 NestJS 全局 `APP_GUARD` 绑定 JwtAuthGuard
- 通过 `@Public()` 装饰器跳过鉴权的路由（如登录/注册）
- 注意：使用 NestJS Reflector + SetMetadata 实现白名单

**4. 修改密码需要旧密码验证**
- `PUT /api/auth/password` 接收 `{ oldPassword, newPassword }`
- 需 JWT 鉴权（已登录用户才能修改自己的密码）
- 从 token 中提取 userId 确定修改哪个用户

**5. 前端 token 管理用 React Context**
- `AuthContext` 提供 token、user、login、logout、changePassword
- API client 中 `request` 函数自动从 localStorage 读取 token 注入 Authorization header
- 401 响应时自动清除 token 并跳转登录页

## Risks / Trade-offs

- [token 泄露] → token 有效期设为 7 天；仅通过 HTTPS 传输
- [首次使用无用户] → 启动时自动创建默认账号 admin/admin123
