import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { MergeCellsOutlined } from '@ant-design/icons';

function MergeNode({ data, selected }: NodeProps) {
  return (
    <div
      style={{
        padding: '12px 16px',
        borderRadius: 12,
        border: '2px solid #4c1d95',
        background: 'rgba(168, 85, 247, 0.08)',
        width: 200,
        boxShadow: selected
          ? '0 0 0 2px rgba(168, 85, 247, 0.5), 0 4px 20px rgba(0,0,0,0.3)'
          : '0 2px 10px rgba(0,0,0,0.2)',
        transition: 'box-shadow 0.2s',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          color: '#a855f7',
          fontWeight: 600,
          fontSize: 14,
        }}
      >
        <MergeCellsOutlined style={{ fontSize: 17 }} />
        <span>合成</span>
      </div>
      {data.bgmName && (
        <div style={{ fontSize: 11, color: 'rgba(168, 85, 247, 0.7)', marginTop: 4 }}>
          BGM: {data.bgmName}
        </div>
      )}
      {data.readyToMerge && (
        <div style={{ fontSize: 11, color: '#34d399', marginTop: 4 }}>可合成</div>
      )}
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: '#a855f7', width: 10, height: 10 }}
      />
    </div>
  );
}

export default memo(MergeNode);
