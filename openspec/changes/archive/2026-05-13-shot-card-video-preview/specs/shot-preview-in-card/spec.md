## ADDED Requirements

### Requirement: 分镜卡片同时显示视频和 Markdown 提示词
系统 SHALL 在分镜流程卡的 ShotCard 和 ShotNode 中，同时显示视频预览（如有）和 Markdown 渲染的提示词。

#### Scenario: 视频已生成时显示视频缩略图 + 提示词
- **WHEN** 分镜的 generation.status 为 "completed" 且视频 URL 已加载
- **THEN** 卡片上方显示视频缩略图（静音，不自动播放），下方显示 Markdown 渲染的提示词预览

#### Scenario: 点击缩略图播放视频
- **WHEN** 用户点击视频缩略图
- **THEN** 视频开始播放（点击播放，点击暂停或停止）

#### Scenario: 视频未生成时只显示 Markdown 提示词
- **WHEN** 分镜未生成视频或视频 URL 加载中
- **THEN** 卡片内容区显示 Markdown 渲染后的提示词预览（占满内容区）

#### Scenario: 视频 URL 异步加载
- **WHEN** 卡片检测到状态为 "completed"
- **THEN** 异步调用 `getShotVideoUrl` 获取视频 URL，加载中不阻塞 Markdown 提示词显示

#### Scenario: 空提示词
- **WHEN** prompt 为空且无视频
- **THEN** 显示占位文本 "空提示词"
