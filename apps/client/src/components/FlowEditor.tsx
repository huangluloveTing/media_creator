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
import type {
  ProjectFull,
  PrepNode,
  CharacterData,
  WorldSettingData,
  StoryOutlineData,
} from '../types';
import { migrateCharacterProfileToPrepNodes } from '@media-creator/shared';
import StartNode from './nodes/StartNode';
import CharacterNode from './nodes/CharacterNode';
import WorldSettingNode from './nodes/WorldSettingNode';
import StoryOutlineNode from './nodes/StoryOutlineNode';
import ShotsContainerNode from './nodes/ShotsContainerNode';
import MergeNode from './nodes/MergeNode';
import { getShotsContainerWidth, getShotsContainerHeight } from './nodes/shotsContainerLayout';

const nodeTypes: NodeTypes = {
  start: StartNode,
  character: CharacterNode,
  world_setting: WorldSettingNode,
  story_outline: StoryOutlineNode,
  shotsContainer: ShotsContainerNode,
  merge: MergeNode,
};

const CENTER_X = 400;
const PREP_START_Y = 60;
const PREP_SPACING = 90;

function resolvePrepNodes(project: ProjectFull): PrepNode[] {
  const raw = (project as any).prepNodes;
  if (raw && Array.isArray(raw) && raw.length > 0) {
    return raw as unknown as PrepNode[];
  }
  const migrated = migrateCharacterProfileToPrepNodes((project as any).characterProfileJson);
  return migrated;
}

function buildPrepSummary(node: PrepNode): string {
  switch (node.type) {
    case 'character': {
      const data = node.data as CharacterData;
      const names = (data.characters ?? []).map((c) => c.name || '未命名').join('、');
      return names || '未配置角色形象';
    }
    case 'world_setting': {
      const data = node.data as WorldSettingData;
      const parts = [data.era, data.location].filter(Boolean);
      return parts.join(' / ') || '未配置世界观';
    }
    case 'story_outline': {
      const data = node.data as StoryOutlineData;
      return data.premise || '未配置故事梗概';
    }
    default:
      return '未配置';
  }
}

function hydrateFlow(project: ProjectFull): { nodes: Node[]; edges: Edge[] } {
  const prepNodes = resolvePrepNodes(project);
  const containerY = PREP_START_Y + (prepNodes.length + 1) * PREP_SPACING;
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
  ];

  const edges: Edge[] = [];

  // Render prep nodes in order
  let prevNodeId = 'start';
  prepNodes.forEach((pn, i) => {
    const nodeId = `prep-${pn.type}-${i}`;
    nodes.push({
      id: nodeId,
      type: pn.type,
      position: { x: CENTER_X, y: PREP_START_Y + i * PREP_SPACING },
      data: {
        confirmed: pn.status === 'confirmed',
        label: prepLabel(pn.type),
        summary: buildPrepSummary(pn),
      },
      deletable: false,
    });
    edges.push({
      id: `${prevNodeId}->${nodeId}`,
      source: prevNodeId,
      target: nodeId,
      type: 'straight',
      markerEnd: { type: MarkerType.ArrowClosed },
      style: { stroke: '#475569' },
      selectable: false,
    });
    prevNodeId = nodeId;
  });

  // Shots container
  nodes.push({
    id: 'shots-container',
    type: 'shotsContainer',
    position: { x: containerX, y: containerY },
    data: {},
    deletable: false,
    selectable: false,
  });
  edges.push({
    id: `${prevNodeId}->shots-container`,
    source: prevNodeId,
    target: 'shots-container',
    type: 'straight',
    markerEnd: { type: MarkerType.ArrowClosed },
    style: { stroke: '#475569' },
    selectable: false,
  });

  // Merge node
  nodes.push({
    id: 'merge',
    type: 'merge',
    position: { x: CENTER_X, y: mergeY },
    data: {
      bgmName: project.bgmPath ? project.bgmPath.split('/').pop() : undefined,
      readyToMerge: project.status === 'ready_to_merge',
    },
    deletable: false,
  });
  edges.push({
    id: 'shots-container->merge',
    source: 'shots-container',
    target: 'merge',
    type: 'straight',
    markerEnd: { type: MarkerType.ArrowClosed },
    style: { stroke: '#475569' },
    selectable: false,
  });

  return { nodes, edges };
}

function prepLabel(type: string): string {
  switch (type) {
    case 'character':
      return '人物形象';
    case 'world_setting':
      return '世界观设定';
    case 'story_outline':
      return '故事梗概';
    default:
      return type;
  }
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

  useEffect(() => {
    requestAnimationFrame(() => fitView({ padding: 0.2, duration: 200 }));
  }, [state.project?.shots.length, state.project?.id, fitView]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (node.id === 'start') {
        dispatch({ type: 'SELECT_ELEMENT', payload: { id: 'start', type: 'start' } });
      } else if (node.id.startsWith('prep-character')) {
        dispatch({ type: 'SELECT_ELEMENT', payload: { id: node.id, type: 'character' } });
      } else if (node.id.startsWith('prep-world_setting')) {
        dispatch({ type: 'SELECT_ELEMENT', payload: { id: node.id, type: 'world_setting' } });
      } else if (node.id.startsWith('prep-story_outline')) {
        dispatch({ type: 'SELECT_ELEMENT', payload: { id: node.id, type: 'story_outline' } });
      } else if (node.id === 'merge') {
        dispatch({ type: 'SELECT_ELEMENT', payload: { id: 'merge', type: 'merge' } });
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
