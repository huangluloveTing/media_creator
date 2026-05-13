import { memo, Fragment } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Button, Tag, Tooltip } from 'antd';
import {
  PlusOutlined,
  PlayCircleOutlined,
  LoadingOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  DeleteOutlined,
  CameraOutlined,
} from '@ant-design/icons';
import { useProject } from '../../context/ProjectContext';
import { api } from '../../api/client';
import type { Shot, EdgeData } from '../../types';
import {
  CARD_WIDTH,
  CARD_HEIGHT,
  ARROW_WIDTH,
  getShotsContainerWidth,
} from './shotsContainerLayout';

const statusIcons: Record<string, React.ReactNode> = {
  draft: <PlayCircleOutlined style={{ color: '#64748b' }} />,
  queued: <ClockCircleOutlined style={{ color: '#fbbf24' }} />,
  generating: <LoadingOutlined style={{ color: '#4f7cff' }} spin />,
  completed: <CheckCircleOutlined style={{ color: '#34d399' }} />,
  failed: <CloseCircleOutlined style={{ color: '#f87171' }} />,
};

const statusBorder: Record<string, string> = {
  draft: '#1e1e4a',
  queued: '#78350f',
  generating: '#1e3a5f',
  completed: '#064e3b',
  failed: '#7f1d1d',
};

const transitionLabels: Record<string, string> = {
  cut: 'cut',
  dissolve: '叠化',
  fade: '淡入淡出',
  wipe: '擦除',
  none: '无',
};

function ShotsContainerNode(_: NodeProps) {
  const { state, dispatch } = useProject();
  const project = state.project;
  if (!project) return null;

  const shots = [...project.shots].sort((a, b) => a.order - b.order);
  const edgesBySource = new Map<string, EdgeData>();
  for (const e of project.edges) {
    if (e.sourceShotId) edgesBySource.set(e.sourceShotId, e);
  }

  const handleAddShot = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.createShot({ projectId: project.id });
      const full = await api.getProjectFull(project.id);
      dispatch({ type: 'SET_PROJECT', payload: full });
    } catch {
      // ignore
    }
  };

  const handleSelect = (e: React.MouseEvent, shotId: string) => {
    e.stopPropagation();
    dispatch({ type: 'SELECT_ELEMENT', payload: { id: shotId, type: 'shot' } });
  };

  const handleReorder = async (e: React.MouseEvent, shot: Shot, dir: -1 | 1) => {
    e.stopPropagation();
    const newOrder = shot.order + dir;
    if (newOrder < 1 || newOrder > shots.length) return;
    try {
      await api.reorderShot(shot.id, newOrder);
      const full = await api.getProjectFull(project.id);
      dispatch({ type: 'SET_PROJECT', payload: full });
    } catch {
      // ignore
    }
  };

  const handleDelete = async (e: React.MouseEvent, shot: Shot) => {
    e.stopPropagation();
    try {
      await api.deleteShot(shot.id);
      const full = await api.getProjectFull(project.id);
      dispatch({ type: 'SET_PROJECT', payload: full });
      if (state.selectedElementId === shot.id) dispatch({ type: 'DESELECT' });
    } catch {
      // ignore
    }
  };

  return (
    <div
      style={{
        width: getShotsContainerWidth(shots.length),
        background: '#0d0d2b',
        border: '2px solid #1e1e4a',
        borderRadius: 16,
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: '#475569', width: 12, height: 12 }}
      />

      <div
        style={{
          padding: '14px 16px',
          borderBottom: '1px solid #1e1e4a',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: 'rgba(79, 124, 255, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CameraOutlined style={{ color: '#4f7cff', fontSize: 14 }} />
        </div>
        <span style={{ color: '#e2e8f0', fontSize: 14, fontWeight: 600 }}>分镜流程</span>
        <Tag
          style={{
            marginLeft: 'auto',
            background: '#1a1a40',
            borderColor: '#2a2a5a',
            color: '#94a3b8',
          }}
        >
          {shots.length} 个
        </Tag>
      </div>

      <div
        style={{
          padding: '20px 16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
          {shots.length === 0 && (
            <div
              style={{
                color: '#475569',
                fontSize: 13,
                padding: '24px 0',
                marginRight: 12,
              }}
            >
              暂无分镜，点击右侧按钮添加 →
            </div>
          )}

          {shots.map((shot, i) => {
            const outgoingEdge = edgesBySource.get(shot.id);
            const showArrow = i < shots.length - 1;
            return (
              <Fragment key={shot.id}>
                <ShotCard
                  shot={shot}
                  index={i}
                  total={shots.length}
                  selected={state.selectedElementId === shot.id}
                  onSelect={handleSelect}
                  onReorder={handleReorder}
                  onDelete={handleDelete}
                />
                {showArrow && <TransitionArrow edge={outgoingEdge} />}
              </Fragment>
            );
          })}

          {shots.length > 0 && <Connector />}
          <AddCard onClick={handleAddShot} />
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: '#475569', width: 12, height: 12 }}
      />
    </div>
  );
}

function ShotCard({
  shot,
  index,
  total,
  selected,
  onSelect,
  onReorder,
  onDelete,
}: {
  shot: Shot;
  index: number;
  total: number;
  selected: boolean;
  onSelect: (e: React.MouseEvent, shotId: string) => void;
  onReorder: (e: React.MouseEvent, shot: Shot, dir: -1 | 1) => void;
  onDelete: (e: React.MouseEvent, shot: Shot) => void;
}) {
  const status = shot.generation?.status ?? 'draft';
  const border = statusBorder[status] ?? '#1e1e4a';

  return (
    <div
      onClick={(e) => onSelect(e, shot.id)}
      style={{
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        flexShrink: 0,
        borderRadius: 12,
        border: `2px solid ${selected ? '#4f7cff' : border}`,
        background: selected ? 'rgba(79, 124, 255, 0.08)' : '#131330',
        boxShadow: selected
          ? '0 0 0 3px rgba(79, 124, 255, 0.15), 0 4px 12px rgba(0,0,0,0.3)'
          : '0 2px 8px rgba(0,0,0,0.25)',
        padding: '10px 12px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        transition: 'all 0.15s',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span
          style={{
            minWidth: 24,
            height: 20,
            padding: '0 6px',
            borderRadius: 5,
            background: '#1a1a40',
            color: '#94a3b8',
            fontSize: 11,
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          #{shot.order}
        </span>
        <span style={{ fontSize: 14, lineHeight: 1 }}>{statusIcons[status]}</span>
      </div>

      <div
        style={{
          flex: 1,
          fontSize: 12,
          lineHeight: 1.4,
          color: '#cbd5e1',
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {shot.prompt.slice(0, 80) || <span style={{ color: '#475569' }}>空提示词</span>}
      </div>

      <div
        style={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}
        onClick={(e) => e.stopPropagation()}
      >
        <Tooltip title="左移">
          <Button
            size="small"
            type="text"
            icon={<ArrowLeftOutlined />}
            disabled={index === 0}
            onClick={(e) => onReorder(e, shot, -1)}
            style={{ color: '#64748b', padding: '0 6px' }}
          />
        </Tooltip>
        <Tooltip title="右移">
          <Button
            size="small"
            type="text"
            icon={<ArrowRightOutlined />}
            disabled={index === total - 1}
            onClick={(e) => onReorder(e, shot, 1)}
            style={{ color: '#64748b', padding: '0 6px' }}
          />
        </Tooltip>
        <Tooltip title="删除">
          <Button
            size="small"
            type="text"
            icon={<DeleteOutlined />}
            onClick={(e) => onDelete(e, shot)}
            style={{ color: '#64748b', padding: '0 6px' }}
          />
        </Tooltip>
      </div>

      {(status === 'queued' || status === 'generating') && (
        <ProgressStrip status={status} progress={shot.generation?.progress ?? 0} />
      )}
    </div>
  );
}

function ProgressStrip({ status, progress }: { status: string; progress: number }) {
  const indeterminate = status === 'queued';
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: 3,
        background: '#1e1e4a',
        overflow: 'hidden',
      }}
    >
      {indeterminate ? (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            width: '40%',
            background: 'linear-gradient(90deg, transparent, #fbbf24, transparent)',
            animation: 'shotProgressSlide 1.4s ease-in-out infinite',
          }}
        />
      ) : (
        <div
          style={{
            width: `${progress}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #4f7cff, #6366f1)',
            transition: 'width 0.5s',
          }}
        />
      )}
      <style>{`
        @keyframes shotProgressSlide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(350%); }
        }
      `}</style>
    </div>
  );
}

function TransitionArrow({ edge }: { edge: EdgeData | undefined }) {
  const label = edge ? (transitionLabels[edge.transitionType] ?? edge.transitionType) : 'cut';
  const showDuration = edge && edge.transitionType !== 'cut' && edge.transitionType !== 'none';

  return (
    <div
      style={{
        width: ARROW_WIDTH,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
      }}
    >
      <div
        style={{
          fontSize: 10,
          color: '#94a3b8',
          background: '#1a1a40',
          border: '1px solid #2a2a5a',
          borderRadius: 4,
          padding: '2px 8px',
          whiteSpace: 'nowrap',
          maxWidth: ARROW_WIDTH - 4,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {label}
        {showDuration && ` · ${edge!.transitionDuration}s`}
      </div>
      <Arrow width={ARROW_WIDTH} />
    </div>
  );
}

function Connector() {
  return (
    <div
      style={{
        width: 32,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Arrow width={32} dashed />
    </div>
  );
}

function Arrow({ width, dashed = false }: { width: number; dashed?: boolean }) {
  const headSize = 6;
  const lineEnd = width - headSize - 2;
  return (
    <svg width={width} height={14} style={{ display: 'block' }}>
      <line
        x1={2}
        y1={7}
        x2={lineEnd}
        y2={7}
        stroke="#475569"
        strokeWidth={1.5}
        strokeDasharray={dashed ? '3 3' : undefined}
      />
      <polygon
        points={`${lineEnd},${7 - headSize / 2} ${lineEnd + headSize},7 ${lineEnd},${7 + headSize / 2}`}
        fill="#475569"
      />
    </svg>
  );
}

function AddCard({ onClick }: { onClick: (e: React.MouseEvent) => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        flexShrink: 0,
        borderRadius: 12,
        border: '2px dashed #2a2a5a',
        background: 'transparent',
        color: '#64748b',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        transition: 'all 0.15s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#4f7cff';
        e.currentTarget.style.color = '#4f7cff';
        e.currentTarget.style.background = 'rgba(79, 124, 255, 0.04)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#2a2a5a';
        e.currentTarget.style.color = '#64748b';
        e.currentTarget.style.background = 'transparent';
      }}
    >
      <PlusOutlined style={{ fontSize: 22 }} />
      <span style={{ fontSize: 12, fontWeight: 500 }}>新增分镜</span>
    </button>
  );
}

export default memo(ShotsContainerNode);
