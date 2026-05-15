import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { FlagOutlined } from '@ant-design/icons';

function StartNode({ data, selected }: NodeProps) {
  return (
    <div
      style={{
        padding: '12px 16px',
        borderRadius: 12,
        border: '2px solid #064e3b',
        background: 'rgba(52, 211, 153, 0.08)',
        width: 200,
        boxShadow: selected
          ? '0 0 0 2px rgba(52, 211, 153, 0.5), 0 4px 20px rgba(0,0,0,0.3)'
          : '0 2px 10px rgba(0,0,0,0.2)',
        transition: 'box-shadow 0.2s',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          color: '#34d399',
          fontWeight: 600,
          fontSize: 14,
        }}
      >
        <FlagOutlined style={{ fontSize: 17 }} />
        <span>开始</span>
      </div>
      {data.summary && (
        <div style={{ fontSize: 11, color: 'rgba(52, 211, 153, 0.7)', marginTop: 4 }}>
          {data.summary}
        </div>
      )}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: '#34d399', width: 10, height: 10 }}
      />
    </div>
  );
}

export default memo(StartNode);
