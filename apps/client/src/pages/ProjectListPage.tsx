import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Typography, Tag, Space, Spin, Empty, Popconfirm, message, Modal, Form, Input, Select } from 'antd';
import { PlusOutlined, DeleteOutlined, LoadingOutlined, ClockCircleOutlined, CameraOutlined } from '@ant-design/icons';
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

const resolutionOptions = [
  { value: '1920x1080', label: '1920x1080 (Full HD)' },
  { value: '1080x1920', label: '1080x1920 (竖屏)' },
  { value: '3840x2160', label: '3840x2160 (4K)' },
  { value: '1280x720', label: '1280x720 (HD)' },
];

const transitionOptions = [
  { value: 'cut', label: '硬切' },
  { value: 'dissolve', label: '叠化' },
  { value: 'fade', label: '淡入淡出' },
  { value: 'wipe', label: '擦除' },
  { value: 'none', label: '无' },
];

export default function ProjectListPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.getProjects().then(setProjects).finally(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      const project = await api.createProject({
        title: values.title,
        resolution: values.resolution || '1920x1080',
        fps: values.fps || 24,
        defaultTransitionType: values.defaultTransitionType || 'dissolve',
        globalStylePrompt: values.globalStylePrompt || '',
      });
      setProjects((prev) => [project, ...prev]);
      form.resetFields();
      setModalOpen(false);
      message.success('项目创建成功');
    } catch (err: any) {
      if (err.errorFields) return; // validation error
      message.error(`创建失败: ${err.message}`);
    } finally {
      setSubmitting(false);
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

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: 48,
        background: 'linear-gradient(135deg, #0a0a1a 0%, #0f0f2e 50%, #0a0a1a 100%)',
      }}
    >
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        {/* Header */}
        <Space align="center" size={12} style={{ marginBottom: 24 }}>
          <Title level={4} style={{ margin: 0, color: '#f1f5f9' }}>
            项目
          </Title>
          <Tag style={{ background: '#1a1a40', borderColor: '#2a2a5a', color: '#94a3b8' }}>
            {projects.length} 个
          </Tag>
          <div style={{ flex: 1 }} />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setModalOpen(true)}
            style={{
              background: 'linear-gradient(135deg, #4f7cff, #6366f1)',
              border: 'none',
              fontWeight: 600,
            }}
          >
            创建项目
          </Button>
        </Space>

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
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setModalOpen(true)}
              style={{ marginTop: 12 }}
            >
              创建第一个项目
            </Button>
          </Empty>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 16,
            }}
          >
            {projects.map((p) => {
              const s = statusConfig[p.status] ?? statusConfig.draft;
              const shotCount = (p as any).shots?.length ?? '-';
              return (
                <Card
                  key={p.id}
                  hoverable
                  onClick={() => navigate(`/project/${p.id}`)}
                  style={{
                    background: '#131330',
                    borderColor: '#1e1e4a',
                    cursor: 'pointer',
                    borderRadius: 12,
                  }}
                  styles={{ body: { padding: '20px' } }}
                >
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Text strong style={{ color: '#e2e8f0', fontSize: 15, flex: 1 }}>
                        {p.title}
                      </Text>
                      <Popconfirm
                        title="确定删除？"
                        description="所有镜头和视频将被移除。"
                        onConfirm={(e) => { e?.stopPropagation(); handleDelete(p.id); }}
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
                    </div>
                    <Tag color={s.color} style={{ alignSelf: 'flex-start', fontSize: 11 }}>
                      {s.label}
                    </Tag>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <Text style={{ color: '#64748b', fontSize: 12 }}>
                        {p.resolution} @ {p.fps}fps
                      </Text>
                      <Text style={{ color: '#64748b', fontSize: 12 }}>
                        <CameraOutlined style={{ marginRight: 4 }} />
                        {shotCount} 镜头
                      </Text>
                      <Text style={{ color: '#64748b', fontSize: 12 }}>
                        <ClockCircleOutlined style={{ marginRight: 4 }} />
                        {formatDate(p.createdAt)}
                      </Text>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal
        title="创建项目"
        open={modalOpen}
        onOk={handleCreate}
        onCancel={() => { form.resetFields(); setModalOpen(false); }}
        confirmLoading={submitting}
        okText="创建"
        cancelText="取消"
        width={520}
        styles={{ body: { paddingTop: 20 } }}
      >
        <Form form={form} layout="vertical" initialValues={{ resolution: '1920x1080', fps: 24, defaultTransitionType: 'dissolve' }}>
          <Form.Item name="title" label="项目名称" rules={[{ required: true, message: '请输入项目名称' }]}>
            <Input placeholder="输入项目名称" />
          </Form.Item>
          <Space size={16}>
            <Form.Item name="resolution" label="分辨率">
              <Select options={resolutionOptions} style={{ width: 210 }} />
            </Form.Item>
            <Form.Item name="fps" label="帧率">
              <Select options={[
                { value: 24, label: '24 fps' },
                { value: 25, label: '25 fps' },
                { value: 30, label: '30 fps' },
              ]} style={{ width: 120 }} />
            </Form.Item>
          </Space>
          <Form.Item name="defaultTransitionType" label="默认转场">
            <Select options={transitionOptions} />
          </Form.Item>
          <Form.Item name="globalStylePrompt" label="全局风格提示词">
            <Input.TextArea rows={3} placeholder="可选，描述整体视频风格..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
