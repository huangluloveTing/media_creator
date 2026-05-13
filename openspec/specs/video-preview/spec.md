## ADDED Requirements

### Requirement: Merge 完成后自动显示视频预览

系统 SHALL 在合成完成后，在 MergeProperties 面板中嵌入视频播放器，用户可立即预览合成结果。

#### Scenario: 合成成功后显示播放器
- **WHEN** merge 请求成功返回
- **THEN** 面板中显示 `<video controls>` 元素，src 为返回的 presigned URL

#### Scenario: 合成失败时不显示播放器
- **WHEN** merge 请求失败
- **THEN** 显示错误信息，不显示视频播放器

### Requirement: 修复 API 客户端 merge 响应类型

系统 SHALL 修复前端 API 客户端中 merge 方法的响应类型，从 `outputPath` 改为 `url`。

#### Scenario: merge 响应包含 url 字段
- **WHEN** 前端调用 `api.merge(projectId)`
- **THEN** 响应类型为 `{ ok: boolean; url: string }`

### Requirement: 历史合成结果预览

系统 SHALL 在重新打开已合成完成的项目时，自动加载并显示合成视频预览。

#### Scenario: 打开已合成项目显示视频
- **WHEN** 用户打开一个 `status === 'completed'` 的项目
- **THEN** MergeProperties 面板自动加载 final-video 的 presigned URL 并显示视频播放器

#### Scenario: final-video 不存在时不显示播放器
- **WHEN** 项目 status 为 `completed` 但 `finalVideoKey` 为空
- **THEN** 不显示视频播放器，显示"合成结果不可用"提示

### Requirement: 重新合成功能

系统 SHALL 在已有合成结果时提供"重新合成"按钮，方便用户调整参数后再次合成。

#### Scenario: 重新合成
- **WHEN** 已有合成结果显示，用户点击"重新合成"按钮
- **THEN** 执行新的 merge 流程，完成后更新视频预览
