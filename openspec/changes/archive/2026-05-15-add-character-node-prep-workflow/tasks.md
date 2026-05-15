## 1. Character Node Foundation

- [x] 1.1 在流程图中新增人物形象节点（位于分镜容器前）并定义节点数据结构
- [x] 1.2 实现人物形象节点的编辑 UI（角色名、外观、服饰、固定特征、禁改项）
- [x] 1.3 将人物形象节点数据持久化到项目/草案上下文并支持读取回显

## 2. Chatbox Workflow Upgrade

- [x] 2.1 将 chatbox 工作流改为分阶段状态机（形象生成→形象确认→分镜生成→分镜迭代）
- [x] 2.2 在形象未确认时对分镜生成进行门控并展示引导提示
- [x] 2.3 在 chatbox 中持续展示并同步“当前人物形象摘要”

## 3. LLM Prompt & Generation Pipeline

- [x] 3.1 扩展导演式系统提示词，加入人物形象节点约束注入
- [x] 3.2 生成前加入形象约束完整性检查，缺失时触发澄清或补全提示
- [x] 3.3 分镜生成后执行“形象元素覆盖度”校验，保证每个镜头包含至少一个形象元素

## 4. SSE Interaction Enhancements

- [x] 4.1 扩展 SSE 事件（`character-draft`、`character-confirmation-needed`、`character-summary`）
- [x] 4.2 前端消费新增事件并渲染为系统卡片，不覆盖历史对话
- [x] 4.3 在完成态中返回形象摘要 + 分镜摘要 + 差异信息

## 5. Integration & Validation

- [x] 5.1 后端测试：形象门控、约束注入、形象元素覆盖校验
- [x] 5.2 前端测试：人物节点编辑、workflow 阶段切换、事件渲染与摘要同步
- [x] 5.3 端到端验证：先形象后分镜流程下角色一致性与用户意图对齐
