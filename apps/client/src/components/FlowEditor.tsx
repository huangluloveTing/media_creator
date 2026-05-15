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
  useReactFlow,
  Connection,
  MarkerType,
  NodeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useProject } from '../context/ProjectContext';
import type { ProjectFull } from '../types';
import StartNode from './nodes/StartNode';
import CharacterNode from './nodes/CharacterNode';
import ShotsContainerNode from './nodes/ShotsContainerNode';
import MergeNode from './nodes/MergeNode';
import { getShotsContainerWidth, getShotsContainerHeight } from './nodes/shotsContainerLayout';

const nodeTypes: NodeTypes = {
  start: StartNode,
  character: CharacterNode,
  shotsContainer: ShotsContainerNode,
  merge: MergeNode,
};

const CENTER_X = 400;

function hydrateFlow(project: ProjectFull): { nodes: Node[]; edges: Edge[] } {
  const characterY = 90;
  const containerY = 220;
  const containerWidth = getShotsContainerWidth(project.shots.length);
  const containerHeight = getShotsContainerHeight();
  const containerX = CENTER_X - containerWidth / 2;
  const mergeY = containerY + containerHeight + 80;

  const nodes: Node[] = [
    {
      id: 'start',
      type: 'start',
      position: { x: CENTER_X, y: 0 },
      data: {
        summary: `${project.resolution} @ ${project.fps}fps / ${project.defaultTransitionType}`,
      },
      deletable: false,
    },
    {
      id: 'character',
      type: 'character',
      position: { x: CENTER_X, y: characterY },
      data: {
        confirmed: Boolean((project as any).characterProfileJson?.confirmed),
        summary: buildCharacterSummary((project as any).characterProfileJson),
      },
      deletable: false,
    },
    {
      id: 'shots-container',
      type: 'shotsContainer',
      position: { x: containerX, y: containerY },
      data: {},
      deletable: false,
      selectable: false,
    },
    {
      id: 'merge',
      type: 'merge',
      position: { x: CENTER_X, y: mergeY },
      data: {
        bgmName: project.bgmPath ? project.bgmPath.split('/').pop() : undefined,
        readyToMerge: project.status === 'ready_to_merge',
      },
      deletable: false,
    },
  ];

  const edges: Edge[] = [
    {
      id: 'start->character',
      source: 'start',
      target: 'character',
      type: 'straight',
      markerEnd: { type: MarkerType.ArrowClosed },
      style: { stroke: '#475569' },
      selectable: false,
    },
    {
      id: 'character->shots-container',
      source: 'character',
      target: 'shots-container',
      type: 'straight',
      markerEnd: { type: MarkerType.ArrowClosed },
      style: { stroke: '#475569' },
      selectable: false,
    },
    {
      id: 'shots-container->merge',
      source: 'shots-container',
      target: 'merge',
      type: 'straight',
      markerEnd: { type: MarkerType.ArrowClosed },
      style: { stroke: '#475569' },
      selectable: false,
    },
  ];

  return { nodes, edges };
}

export default function FlowEditor() {
  const { state, dispatch } = useProject();
  const { fitView } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    if (state.project) {
      const { nodes: hydratedNodes, edges: hydratedEdges } = hydrateFlow(state.project);
      setNodes(hydratedNodes);
      setEdges(hydratedEdges);
    }
  }, [state.project, setNodes, setEdges]);

  // Auto-fit viewport when shot count changes
  useEffect(() => {
    // Wait for nodes to render before fitting
    requestAnimationFrame(() => fitView({ padding: 0.2, duration: 200 }));
  }, [state.project?.shots.length, state.project?.id, fitView]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (node.id === 'start') {
        dispatch({ type: 'SELECT_ELEMENT', payload: { id: 'start', type: 'start' } });
      } else if (node.id === 'character') {
        dispatch({ type: 'SELECT_ELEMENT', payload: { id: 'character', type: 'character' } });
      } else if (node.id === 'merge') {
        dispatch({ type: 'SELECT_ELEMENT', payload: { id: 'merge', type: 'merge' } });
      }
      // shots-container: row clicks dispatch SELECT internally
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
        onConnect={onConnect}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        deleteKeyCode={null}
        snapToGrid
        snapGrid={[20, 20]}
      >
        <Controls position="bottom-right" className="flow-controls" />
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#1e1e4a" />
      </ReactFlow>
    </div>
  );
}

function buildCharacterSummary(profile?: Record<string, unknown>) {
  if (!profile) return '未配置角色形象';
  const p = profile as any;
  const parts: string[] = [];
  if (p.characterName) parts.push(String(p.characterName));
  if (Array.isArray(p.appearance) && p.appearance.length) parts.push(`外观:${p.appearance[0]}`);
  if (Array.isArray(p.outfit) && p.outfit.length) parts.push(`服饰:${p.outfit[0]}`);
  return parts.join(' / ') || '未配置角色形象';
}
