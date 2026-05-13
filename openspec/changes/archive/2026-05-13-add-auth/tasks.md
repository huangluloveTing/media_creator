## 1. 后端依赖安装

- [x] 1.1 安装 `@nestjs/jwt`、`@nestjs/passport`、`passport`、`passport-jwt`、`bcrypt` 及类型

## 2. 后端 Auth 模块

- [x] 2.1 创建 User entity（id, username, password, timestamps）
- [x] 2.2 创建 AuthService（register, login, validateUser, changePassword）
- [x] 2.3 创建 AuthController（POST /auth/login, POST /auth/register, PUT /auth/password）
- [x] 2.4 创建 JwtStrategy + JwtAuthGuard（passport-jwt）
- [x] 2.5 创建 `@Public()` 装饰器 + 全局 guard 注册
- [x] 2.6 启动时自动创建默认管理员账号

## 3. 前端登录

- [x] 3.1 创建 AuthContext（token 存储、login、logout、changePassword、user 状态）
- [x] 3.2 API client 注入 Authorization header + 401 自动退出
- [x] 3.3 创建 LoginPage（登录表单）
- [x] 3.4 创建 ChangePasswordPage（修改密码表单）
- [x] 3.5 App.tsx 增加路由守卫 + `/login` + `/change-password` 路由
