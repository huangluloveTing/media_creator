## ADDED Requirements

### Requirement: Upload character image for shot

系统 SHALL 允许用户在分镜编辑面板中上传角色/IP 形象参考图。上传的图片 MUST 存储到 MinIO，图片 URL MUST 写入 `shot.characterRef` 字段，并在视频生成时作为 `referenceImages` 传递给 Seedance API。

#### Scenario: Upload image via button

- **WHEN** 用户在分镜编辑面板的"主形象"区域点击"上传图片"按钮并选择本地图片文件
- **THEN** 系统将图片上传至后端 MinIO 存储，返回图片 URL，更新 `shot.characterRef` 为该 URL，并在 UI 中显示图片预览

#### Scenario: Upload image via drag and drop

- **WHEN** 用户将图片文件拖拽到主形象上传区域
- **THEN** 系统接受图片文件并执行与点击上传相同的上传流程

#### Scenario: Remove uploaded image

- **WHEN** 用户点击已上传图片的删除按钮
- **THEN** 系统清空 `shot.characterRef` 字段，移除图片预览

#### Scenario: Invalid file type

- **WHEN** 用户上传非图片格式文件（如 PDF、视频）
- **THEN** 系统拒绝上传并显示错误提示"仅支持 JPG/PNG/WebP 格式"

#### Scenario: File size exceeds limit

- **WHEN** 用户上传超过 5MB 的图片
- **THEN** 系统拒绝上传并显示错误提示"图片大小不能超过 5MB"

### Requirement: Generate character image via LLM

系统 SHALL 允许用户通过大模型生成角色/IP 形象图。用户输入形象描述文本后，系统 MUST 调用后端 LLM 接口生成图片，并将生成的图片 URL 写入 `shot.characterRef`。

#### Scenario: Generate image from description

- **WHEN** 用户在"主形象"区域点击"AI 生成"按钮，输入形象描述文本并确认
- **THEN** 系统调用 LLM 图片生成 API，显示生成进度，完成后展示生成的图片预览，并更新 `shot.characterRef`

#### Scenario: LLM does not support image generation

- **WHEN** 当前配置的 LLM 模型不支持图片生成
- **THEN** 系统显示提示"当前模型不支持图片生成"，并将用户输入的描述文本作为文字参考写入 `characterRef`

#### Scenario: Generate image failed

- **WHEN** LLM 图片生成请求失败
- **THEN** 系统显示错误信息，`characterRef` 保持之前的值不变

### Requirement: Character image preview in shot card

系统 SHALL 在分镜卡片（`ShotCard`）中展示主形象缩略图（如果 `characterRef` 有值）。

#### Scenario: Shot has character image

- **WHEN** 分镜的 `characterRef` 不为空
- **THEN** 分镜卡片中显示该图片的缩略图

#### Scenario: Shot has no character image

- **WHEN** 分镜的 `characterRef` 为空
- **THEN** 分镜卡片不显示图片缩略图，保持现有布局
