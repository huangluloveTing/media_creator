import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, Input, Button, Space, Typography, message, Spin } from 'antd';
import { SettingOutlined, ArrowLeftOutlined, ApiOutlined, CloudOutlined } from '@ant-design/icons';
import { api } from '../api/client';
import type { Setting } from '../types';

const { Title, Text } = Typography;

const SEEDANCE_API_KEY = 'seedance.apiKey';

export default function SettingsPage() {
  const [setting, setSetting] = useState<Setting | null>(null);
  const [editing, setEditing] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .getSettings()
      .then((list) => {
        setSetting(list.find((s) => s.key === SEEDANCE_API_KEY) ?? null);
      })
      .catch((e) => message.error('加载配置失败: ' + e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const [updated] = await api.updateSettings([{ key: SEEDANCE_API_KEY, value: editing }]);
      setSetting(updated ?? setting);
      setEditing('');
      message.success('Seedance 配置已保存');
    } catch (e: any) {
      message.error('保存失败: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}
      >
        <Spin tip="加载配置..." />
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a0a1a 0%, #0f0f2e 50%, #0a0a1a 100%)',
        padding: '48px 24px',
      }}
    >
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <Space align="center" style={{ marginBottom: 32 }}>
          <Link to="/">
            <Button type="text" icon={<ArrowLeftOutlined />} style={{ color: '#94a3b8' }} />
          </Link>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #4f7cff, #6366f1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(79, 124, 255, 0.3)',
            }}
          >
            <SettingOutlined style={{ fontSize: 22, color: '#fff' }} />
          </div>
          <div>
            <Title level={4} style={{ margin: 0, color: '#e2e8f0' }}>
              API 配置
            </Title>
            <Text type="secondary">配置 Seedance API Key</Text>
          </div>
        </Space>

        <Card
          style={{
            background: '#131330',
            borderColor: '#1e1e4a',
            borderRadius: 12,
          }}
          title={
            <Space>
              <CloudOutlined style={{ fontSize: 22, color: '#4f7cff' }} />
              <span style={{ color: '#e2e8f0', fontSize: 15, fontWeight: 600 }}>Seedance</span>
            </Space>
          }
        >
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <div>
              <Text style={{ display: 'block', marginBottom: 6, color: '#94a3b8', fontSize: 13 }}>
                API Key
              </Text>
              <Input.Password
                placeholder={setting?.value || '请输入 Seedance API Key'}
                value={editing}
                onChange={(e) => setEditing(e.target.value)}
                style={{
                  background: '#0a0a1a',
                  borderColor: '#1e1e4a',
                  color: '#e2e8f0',
                }}
              />
            </div>
            <Button
              type="primary"
              icon={<ApiOutlined />}
              loading={saving}
              disabled={!editing}
              onClick={handleSave}
              style={{ borderRadius: 8, marginTop: 4 }}
            >
              保存配置
            </Button>
          </Space>
        </Card>
      </div>
    </div>
  );
}
