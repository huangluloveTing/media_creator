## Context

`ReactFlow` 的 `fitView` prop 只在**首次挂载渲染完成后**触发一次。当 state.project 更新导致 `hydrateFlow` 重建节点时，`setNodes`/`setEdges` 使用新位置更新状态，但画布视口不会自动调整。

## Goals / Non-Goals

**Goals:**
- 新增/删除分镜后画布自动缩放平移，让所有节点可见
- 合适的 padding（20%）让节点不贴边
- 仅在 nodes 实际变化时触发，避免不必要的 `fitView` 抖动

**Non-Goals:**
- 不改变画布交互行为（用户仍然可以手动平移/缩放）
- 不改动节点布局逻辑

## Decisions

**Decision 1: `useReactFlow().fitView()` 替代 `fitView` prop**

移除 JSX 上的 `fitView` prop，改用 hook 在 `useEffect` 中调用。`useReactFlow()` 需要放在 `ReactFlowProvider` 内使用——FlowEditor 已在 `ReactFlowProvider` 内（见 ProjectEditorPage.tsx）。

**Decision 2: 用 `shotCount` 作为依赖触发 reshape**

将 `state.project?.shots.length` 作为 `useEffect` 的依赖（与 hydrateFlow 的触发时机一致），在分镜数变化后调用 `fitView({ padding: 0.2, duration: 200 })`。`duration` 添加平滑过渡动画。

## Risks / Trade-offs

- **Risk: 动画与手动缩放冲突** → `duration: 200` 仅 200ms，短暂动画不影响后续手动操作
- **Risk: 空项目（0 shots）导致奇怪视口** → 空项目只有 start + 空容器 + merge 三个节点，`fitView` 仍能正常工作
