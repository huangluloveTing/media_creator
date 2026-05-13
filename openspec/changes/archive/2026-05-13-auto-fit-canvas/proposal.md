## Why

当前 React Flow 画布在初始加载时调用 `fitView`，但后续新增/删除分镜后容器宽度动态变化时不会自动调整视口，导致新增的分镜卡片可能超出可视区域，需要用户手动缩放/平移才能看到全部内容。

## What Changes

- **移除 `fitView` prop**（只在首次渲染生效，后续不触发）
- **使用 `useReactFlow().fitView()`**：在节点数量/位置变化后调用 `fitView()`，确保画布始终展示全部节点
- **增加合适 padding**：`fitView({ padding: 0.2 })` 让节点周围留 20% 空白边距，视觉更舒适

## Capabilities

### New Capabilities
- `auto-fit-viewport`: 分镜数量变化时自动调整画布视口，确保所有节点可见

## Impact

- **修改**: `apps/client/src/components/FlowEditor.tsx` — 导入 `useReactFlow`，移除 `fitView` prop，添加 `useEffect` 在 project 更新后调用 `fitView`
