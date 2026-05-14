## 1. 后端 — 图片上传模块

- [x] 1.1 新增 `ImageModule`（NestJS module），注册图片上传路由
- [x] 1.2 在 `StorageService` 中新增 `uploadImage(file, key)` 方法，支持 `image/*` 内容类型
- [x] 1.3 新增 `POST /images/upload` 端点，接收 multipart 图片文件，校验类型（JPG/PNG/WebP）和大小（≤5MB），上传到 MinIO 并返回图片 URL
- [x] 1.4 新增 `GET /images/:key/url` 端点，返回图片的 presigned URL（复用 `getSignedUrl`）

## 2. 后端 — LLM 图片生成

- [x] 2.1 新增 `POST /llm/generate-image` 端点，接收形象描述文本，调用配置的 LLM 图片生成接口
- [x] 2.2 如果 LLM 不支持图片生成，返回 `{ supported: false }`，前端降级为文字描述模式
- [x] 2.3 生成成功后，将图片下载并上传到 MinIO（复用图片上传），返回图片 URL

## 3. 前端 — 主形象 UI 组件

- [x] 3.1 创建 `CharacterImageUpload` 组件，支持拖拽/点击上传图片，上传前校验类型和大小，显示上传进度
- [x] 3.2 上传成功后显示图片预览和删除按钮，删除时清空 `characterRef`
- [x] 3.3 在 `api/client.ts` 中新增 `uploadCharacterImage(file, shotId)` 和 `generateCharacterImage(description, shotId)` 方法

## 4. 前端 — 主形象整合到 ShotProperties

- [x] 4.1 在 `ShotProperties.tsx` 的提示词区域和镜头参数区域之间插入"主形象"区域
- [x] 4.2 集成 `CharacterImageUpload` 组件，已上传的图片显示预览缩略图
- [x] 4.3 添加"AI 生成"按钮，弹出输入框让用户输入形象描述，调用 LLM 生图 API
- [x] 4.4 处理 LLM 不支持的降级情况：显示提示并将描述文本写入 `characterRef`

## 5. 前端 — 分镜卡片主形象预览

- [x] 5.1 在 `ShotsContainerNode.tsx` 的 `ShotCard` 组件中，如果 `characterRef` 有值则显示图片缩略图

## 6. 前端 — 右侧面板可折叠

- [x] 6.1 在 `ShotProperties.tsx` 中使用 Ant Design `Collapse` 组件包裹镜头参数、生成参数、转场三个 `<fieldset>` 区域
- [x] 6.2 提示词区域保持在 `Collapse` 外部，始终展开
- [x] 6.3 设置 `Collapse` 默认全部展开，`ghost` 样式适配暗色主题
- [x] 6.4 切换分镜时折叠状态重置为全部展开

## 7. 验证

- [x] 7.1 手动测试：上传图片 → 预览 → 删除 → 重新上传
- [x] 7.2 手动测试：AI 生成形象 → 成功/失败/不支持三种场景
- [x] 7.3 手动测试：折叠/展开各区域，切换分镜后折叠状态重置
- [x] 7.4 手动测试：设置主形象后生成分镜视频，确认 `characterRef` 传递给 Seedance
