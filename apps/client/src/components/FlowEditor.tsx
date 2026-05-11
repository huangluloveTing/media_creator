import { useCallback, useEffect } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  Controls,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  Connection,
  MarkerType,
  NodeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useProject } from '../context/ProjectContext';
import type { ProjectFull } from '../types';
import StartNode from './nodes/StartNode';
import ShotNode from './nodes/ShotNode';
import MergeNode from './nodes/MergeNode';

const nodeTypes: NodeTypes = {
  start: StartNode,
  shot: ShotNode,
  merge: MergeNode,
};

function hydrateFlow(project: ProjectFull): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  nodes.push({
    id: 'start',
    type: 'start',
    position: { x: 400, y: 0 },
    data: {
      summary: `${project.resolution} @ ${project.fps}fps / ${project.defaultTransitionType}`,
    },
  });

  const startY = 120;
  const spacingY = 200;

  for (let i = 0; i < project.shots.length; i++) {
    const shot = project.shots[i];
    const gen = shot.generation;
    nodes.push({
      id: shot.id,
      type: 'shot',
      position: { x: 400, y: startY + (i + 1) * spacingY },
      data: {
        order: shot.order,
        promptPreview: shot.prompt.slice(0, 60) || '空提示词',
        status: gen?.status ?? 'draft',
        progress: gen?.progress ?? 0,
        errorPreview: gen?.errorMessage ?? '',
      },
    });
  }

  nodes.push({
    id: 'merge',
    type: 'merge',
    position: { x: 400, y: startY + (project.shots.length + 1) * spacingY },
    data: {
      bgmName: project.bgmPath ? project.bgmPath.split('/').pop() : undefined,
      readyToMerge: project.status === 'ready_to_merge',
    },
  });

  const sortedEdges = [...project.edges].sort((a, b) => a.position - b.position);

  for (const edge of sortedEdges) {
    const sourceId = edge.sourceShotId ?? 'start';
    const targetId = edge.targetShotId ?? 'merge';
    const transLabel =
      edge.transitionType === 'cut' ? 'cut' : `${edge.transitionType} ${edge.transitionDuration}s`;

    edges.push({
      id: edge.id,
      source: sourceId,
      target: targetId,
      type: 'straight',
      animated: false,
      markerEnd: { type: MarkerType.ArrowClosed },
      label: transLabel,
      labelStyle: { fill: '#94a3b8', fontSize: 11, fontWeight: 500 },
      labelBgStyle: { fill: '#131330', fillOpacity: 0.95 },
      labelBgPadding: [4, 8],
      labelBgBorderRadius: 4,
      style: { stroke: '#475569' },
      data: { edgeData: edge },
    });
  }

  return { nodes, edges };
}

export default function FlowEditor() {
  const { state, dispatch } = useProject();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    if (state.project) {
      const { nodes: hydratedNodes, edges: hydratedEdges } = hydrateFlow(state.project);
      setNodes(hydratedNodes);
      setEdges(hydratedEdges);
    }
  }, [state.project, setNodes, setEdges]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (node.id === 'start') {
        dispatch({ type: 'SELECT_ELEMENT', payload: { id: 'start', type: 'start' } });
      } else if (node.id === 'merge') {
        dispatch({ type: 'SELECT_ELEMENT', payload: { id: 'merge', type: 'merge' } });
      } else {
        dispatch({ type: 'SELECT_ELEMENT', payload: { id: node.id, type: 'shot' } });
      }
    },
    [dispatch],
  );

  const onEdgeClick = useCallback(
    (_: React.MouseEvent, edge: Edge) => {
      if (edge.data?.edgeData) {
        dispatch({
          type: 'SELECT_ELEMENT',
          payload: { id: edge.data.edgeData.id, type: 'edge' },
        });
      }
    },
    [dispatch],
  );

  const onConnect = useCallback((_: Connection) => {}, []);

  const onPaneClick = useCallback(() => {
    dispatch({ type: 'DESELECT' });
  }, [dispatch]);

  return (
    <div style={{ flex: 1, height: '100%', background: '#0a0a1a' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onConnect={onConnect}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
        deleteKeyCode={['Backspace', 'Delete']}
        snapToGrid
        snapGrid={[20, 20]}
      >
        <Controls position="bottom-right" className="flow-controls" />
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#1e1e4a" />
      </ReactFlow>
    </div>
  );
}
