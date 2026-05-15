import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { BookOutlined } from '@ant-design/icons';

function StoryOutlineNode({ data, selected }: NodeProps) {
  const confirmed = Boolean((data as any).confirmed);
  const label = ((data as any).label as string) || '故事梗概';
  const summary = ((data as any).summary as string) || '未配置故事梗概';

  return (
    <div
      style={{
        padding: '10px 14px',
        borderRadius: 12,
        border: `2px solid ${confirmed ? '#16a34a' : '#f59e0b'}`,
        background: '#131330',
        width: 260,
        boxShadow: selected
          ? '0 0 0 2px rgba(79,124,255,.45), 0 4px 16px rgba(0,0,0,.25)'
          : '0 2px 10px rgba(0,0,0,.2)',
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: '#475569', width: 10, height: 10 }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <BookOutlined style={{ color: confirmed ? '#22c55e' : '#f59e0b' }} />
        <span style={{ color: '#e2e8f0', fontSize: 12, fontWeight: 600 }}>{label}</span>
        <span style={{ color: confirmed ? '#22c55e' : '#f59e0b', fontSize: 11 }}>
          {confirmed ? '已确认' : '待确认'}
        </span>
      </div>
      <div style={{ color: '#94a3b8', fontSize: 12, lineHeight: 1.4 }}>{summary}</div>
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: '#475569', width: 10, height: 10 }}
      />
    </div>
  );
}

export default memo(StoryOutlineNode);
