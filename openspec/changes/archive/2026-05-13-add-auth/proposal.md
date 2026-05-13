## Why

当前应用完全开放，没有用户认证，任何人都可以访问和操作。需要增加登录页面和 JWT 鉴权，保护所有 API 接口和页面。

## What Changes

- 后端新增 `auth` 模块：用户注册/登录/修改密码、JWT token 签发
- 新数据库表 `users`（TypeORM entity）
- 所有 API 路由增加 JWT 鉴权守卫（`AuthGuard`），登录/注册接口除外
- 前端新增登录页面，token 存 localStorage，请求自动携带
- 前端路由增加守卫，未登录跳转到登录页
- 前端新增修改密码页面/弹窗

## Capabilities

### New Capabilities

- `user-auth`: 用户登录/注册/修改密码、JWT 鉴权、API 保护

### Modified Capabilities

- 无（全新增量）

## Impact

- **后端**: 新增 `auth` 模块（entity、controller、service、guard、strategy）、`@nestjs/jwt`、`@nestjs/passport`、`passport`、`passport-jwt`、`bcrypt` 依赖；新增修改密码端点
- **前端**: 新增 `LoginPage`、`AuthContext`（token 管理）、API client 注入 Authorization 头、路由保护、修改密码页面
- **BREAKING**: 所有现有 API 端点需要 token 才能访问，前端所有页面需要登录
