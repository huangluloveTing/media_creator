## 1. API Client 更新

- [x] 1.1 `createProject` 方法支持传入完整项目参数（title, resolution, fps, defaultTransitionType, globalStylePrompt）

## 2. 创建项目 Modal

- [x] 2.1 替换原有 inline 创建为 "创建项目" 按钮 + Modal
- [x] 2.2 Modal 包含表单字段：标题、分辨率、帧率、默认转场、全局风格提示词
- [x] 2.3 提交成功后刷新列表并关闭 Modal

## 3. 列表优化

- [x] 3.1 项目卡片显示镜头数、创建时间
- [x] 3.2 布局微调（间距、空状态文案）

## 4. 全局 Header

- [x] 4.1 创建 AppHeader 通用组件（logo + 用户菜单）
- [x] 4.2 App.tsx 用 ProtectedLayout 包装受保护路由，统一渲染 Header
- [x] 4.3 ProjectListPage 移除重复 header/user 菜单
