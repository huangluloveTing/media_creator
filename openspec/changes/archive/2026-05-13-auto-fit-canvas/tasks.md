## 1. 修改 FlowEditor

- [x] 1.1 导入 `useReactFlow` from `@xyflow/react`
- [x] 1.2 移除 JSX `<ReactFlow fitView>` prop
- [x] 1.3 添加 `useEffect` 调用 `fitView({ padding: 0.2, duration: 200 })`
- [x] 1.4 触发依赖：`state.project?.shots.length` + `state.project?.id`

## 2. 验证

- [x] 2.1 前端编译通过 (`npx tsc --noEmit` exit=0)
- [ ] 2.2 首次加载页面画布完整居中
- [ ] 2.3 新增分镜后画布自动缩放
- [ ] 2.4 删除分镜后画布自动缩放
