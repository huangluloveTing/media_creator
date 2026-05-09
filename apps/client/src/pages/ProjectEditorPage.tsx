import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ReactFlowProvider } from '@xyflow/react';
import { Layout, Button, Typography, Tag, Space, Spin } from 'antd';
import { ArrowLeftOutlined, PlaySquareOutlined } from '@ant-design/icons';
import { useProject } from '../context/ProjectContext';
import { api } from '../api/client';
import { usePollGenerationStatus } from '../hooks/usePollGenerationStatus';
import { useKeyboard } from '../hooks/useKeyboard';
import FlowEditor from '../components/FlowEditor';
import NodePalette from '../components/NodePalette';
import PropertiesPanel from '../components/panels/PropertiesPanel';

const { Header } = Layout;
const { Text } = Typography;

const statusConfig: Record<string, { label: string; color: string }> = {
  draft: { label: '草稿', color: 'default' },
  queued: { label: '排队中', color: 'blue' },
  generating: { label: '生成中', color: 'processing' },
  ready_to_merge: { label: '待合成', color: 'purple' },
  merging: { label: '合成中', color: 'orange' },
  completed: { label: '已完成', color: 'success' },
};

export default function ProjectEditorPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { dispatch, state } = useProject();

  useEffect(() => {
    if (!projectId) return;
    api.getProjectFull(projectId).then((full) => {
      dispatch({ type: 'SET_PROJECT', payload: full });
    });
  }, [projectId, dispatch]);

  usePollGenerationStatus();
  useKeyboard();

  const status = state.project?.status;
  const s = status ? (statusConfig[status] ?? statusConfig.draft) : null;

  return (
    <Layout style={{ height: '100vh', background: '#0a0a1a' }}>
      {/* Toolbar */}
      <Header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          background: '#0d0d2b',
          borderBottom: '1px solid #1e1e4a',
          height: 48,
          lineHeight: '48px',
        }}
      >
        <Space size={12}>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/')}
            style={{ color: '#94a3b8' }}
          >
            返回
          </Button>
          <div style={{ width: 1, height: 20, background: '#1e1e4a' }} />
          <Space size={8}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: 'linear-gradient(135deg, #4f7cff, #a855f7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <PlaySquareOutlined style={{ fontSize: 14, color: '#fff' }} />
            </div>
            {state.project ? (
              <Text strong style={{ color: '#e2e8f0', fontSize: 14 }}>
                {state.project.title}
              </Text>
            ) : (
              <Spin size="small" />
            )}
          </Space>
        </Space>

        {s && (
          <Tag color={s.color} style={{ margin: 0 }}>
            {s.label}
          </Tag>
        )}
      </Header>

      {/* Body */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          overflow: 'hidden',
        }}
      >
        <NodePalette />
        <ReactFlowProvider>
          <FlowEditor />
        </ReactFlowProvider>
        <PropertiesPanel />
      </div>
    </Layout>
  );
}
