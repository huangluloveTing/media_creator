import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Button,
  Input,
  Typography,
  Tag,
  Space,
  Spin,
  Empty,
  Popconfirm,
  message,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  PlaySquareOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import { api } from '../api/client';
import type { Project } from '../types';

const { Title, Text } = Typography;

const statusConfig: Record<string, { label: string; color: string }> = {
  draft: { label: '草稿', color: 'default' },
  queued: { label: '排队中', color: 'blue' },
  generating: { label: '生成中', color: 'processing' },
  ready_to_merge: { label: '待合成', color: 'purple' },
  merging: { label: '合成中', color: 'orange' },
  completed: { label: '已完成', color: 'success' },
};

export default function ProjectListPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getProjects().then(setProjects).finally(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    if (!title.trim()) return;
    try {
      const project = await api.createProject(title.trim());
      setProjects((prev) => [project, ...prev]);
      setTitle('');
      message.success('项目创建成功');
    } catch (err: any) {
      message.error(`创建失败: ${err.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
      message.success('项目已删除');
    } catch (err: any) {
      message.error(`删除失败: ${err.message}`);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: 48,
        background: 'linear-gradient(135deg, #0a0a1a 0%, #0f0f2e 50%, #0a0a1a 100%)',
      }}
    >
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        {/* Header */}
        <Space align="center" size={12} style={{ marginBottom: 40 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #4f7cff, #a855f7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 20px rgba(79, 124, 255, 0.3)',
            }}
          >
            <PlaySquareOutlined style={{ fontSize: 22, color: '#fff' }} />
          </div>
          <div>
            <Title level={3} style={{ margin: 0, color: '#f1f5f9' }}>
              Media Creator
            </Title>
            <Text style={{ color: '#64748b', fontSize: 13 }}>AI 视频生成工作台</Text>
          </div>
        </Space>

        {/* Create */}
        <Space.Compact style={{ width: '100%', marginBottom: 32 }}>
          <Input
            size="large"
            placeholder="输入项目名称..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onPressEnter={handleCreate}
            style={{
              background: '#131330',
              borderColor: '#1e1e4a',
              color: '#e2e8f0',
            }}
          />
          <Button
            size="large"
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
            style={{
              background: 'linear-gradient(135deg, #4f7cff, #6366f1)',
              border: 'none',
              fontWeight: 600,
            }}
          >
            创建项目
          </Button>
        </Space.Compact>

        {/* Content */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 64 }}>
            <Spin indicator={<LoadingOutlined style={{ fontSize: 28 }} spin />} />
            <p style={{ color: '#64748b', marginTop: 16 }}>加载中...</p>
          </div>
        ) : projects.length === 0 ? (
          <Empty
            description="暂无项目"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            styles={{ description: { color: '#64748b' } }}
          >
            <Text style={{ color: '#475569', fontSize: 13 }}>
              在上方输入名称并点击创建开始你的第一个项目
            </Text>
          </Empty>
        ) : (
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            {projects.map((p) => {
              const s = statusConfig[p.status] ?? statusConfig.draft;
              return (
                <Card
                  key={p.id}
                  hoverable
                  onClick={() => navigate(`/project/${p.id}`)}
                  style={{
                    background: '#131330',
                    borderColor: '#1e1e4a',
                    cursor: 'pointer',
                  }}
                  styles={{ body: { padding: '20px 24px' } }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <Text strong style={{ color: '#e2e8f0', fontSize: 15 }}>
                        {p.title}
                      </Text>
                      <br />
                      <Text style={{ color: '#64748b', fontSize: 12 }}>
                        {p.resolution} @ {p.fps}fps
                      </Text>
                    </div>
                    <Space size={12} align="center">
                      <Tag
                        color={s.color}
                        style={{ margin: 0, fontSize: 12 }}
                      >
                        {s.label}
                      </Tag>
                      <Popconfirm
                        title="确定删除此项目？"
                        description="所有镜头和视频文件将被移除。"
                        onConfirm={(e) => {
                          e?.stopPropagation();
                          handleDelete(p.id);
                        }}
                        onCancel={(e) => e?.stopPropagation()}
                        onPopupClick={(e) => e.stopPropagation()}
                        okText="删除"
                        cancelText="取消"
                      >
                        <Button
                          type="text"
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </Popconfirm>
                    </Space>
                  </div>
                </Card>
              );
            })}
          </Space>
        )}
      </div>
    </div>
  );
}
