import { Button, Typography, Space, message } from 'antd';
import { PlusOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { useProject } from '../context/ProjectContext';
import { api } from '../api/client';

const { Text } = Typography;

export default function NodePalette() {
  const { state, dispatch } = useProject();

  const handleAddShot = async () => {
    if (!state.project) return;
    try {
      await api.createShot({ projectId: state.project.id });
      const full = await api.getProjectFull(state.project.id);
      dispatch({ type: 'SET_PROJECT', payload: full });
    } catch (err: any) {
      message.error(`添加镜头失败: ${err.message}`);
    }
  };

  const handleGenerateAll = async () => {
    if (!state.project) return;
    dispatch({ type: 'SET_GENERATING', payload: true });
    try {
      await api.generateAll(state.project.id);
    } catch (err: any) {
      message.error(`批量生成失败: ${err.message}`);
    }
  };

  const shotCount = state.project?.shots.length ?? 0;

  return (
    <div
      style={{
        width: 180,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        padding: 16,
        background: '#0d0d2b',
        borderRight: '1px solid #1e1e4a',
        flexShrink: 0,
      }}
    >
      <Text
        style={{
          color: '#475569',
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}
      >
        节点
      </Text>

      <Button
        block
        icon={<PlusOutlined />}
        onClick={handleAddShot}
        style={{
          background: '#1a1a40',
          border: '1px solid #2a2a5a',
          color: '#94a3b8',
          height: 38,
          borderRadius: 8,
        }}
      >
        添加镜头
      </Button>

      <div style={{ borderTop: '1px solid #1e1e4a' }} />

      <Button
        block
        type="primary"
        icon={<ThunderboltOutlined />}
        onClick={handleGenerateAll}
        disabled={state.isGenerating || shotCount === 0}
        style={{
          height: 38,
          borderRadius: 8,
          background: 'linear-gradient(135deg, #4f7cff, #6366f1)',
          border: 'none',
          fontWeight: 600,
        }}
      >
        {state.isGenerating ? '生成中...' : '全部生成'}
      </Button>

      <Text
        style={{
          color: '#475569',
          fontSize: 12,
          marginTop: 'auto',
        }}
      >
        {shotCount} 个镜头
      </Text>
    </div>
  );
}
