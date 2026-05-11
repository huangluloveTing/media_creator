import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, Input, Button, Space, Typography, message, Spin } from 'antd';
import { SettingOutlined, ArrowLeftOutlined, ApiOutlined, RobotOutlined, CloudOutlined } from '@ant-design/icons';
import { api } from '../api/client';
import type { Setting } from '../types';

const { Title, Text } = Typography;

interface ProviderConfig {
  title: string;
  icon: React.ReactNode;
  provider: string;
  fields: { key: string; label: string; masked: boolean }[];
}

const PROVIDERS: ProviderConfig[] = [
  {
    title: 'Seedance',
    icon: <CloudOutlined style={{ fontSize: 22, color: '#4f7cff' }} />,
    provider: 'seedance',
    fields: [
      { key: 'seedance.apiKey', label: 'API Key', masked: true },
      { key: 'seedance.apiUrl', label: 'API URL', masked: false },
    ],
  },
  {
    title: 'OpenAI',
    icon: <RobotOutlined style={{ fontSize: 22, color: '#34d399' }} />,
    provider: 'openai',
    fields: [
      { key: 'openai.apiKey', label: 'API Key', masked: true },
      { key: 'openai.apiUrl', label: 'API URL', masked: false },
      { key: 'openai.model', label: 'Model', masked: false },
    ],
  },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .getSettings()
      .then((list) => {
        setSettings(list);
        const initial: Record<string, string> = {};
        for (const s of list) initial[s.key] = '';
        setEditing(initial);
      })
      .catch((e) => message.error('加载配置失败: ' + e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (provider: string) => {
    const items = PROVIDERS.find((p) => p.provider === provider)
      ?.fields.filter((f) => editing[f.key] !== undefined && editing[f.key] !== '')
      .map((f) => ({ key: f.key, value: editing[f.key] }));

    if (!items?.length) return;

    setSaving(true);
    try {
      const updated = await api.updateSettings(items);
      setSettings((prev) => {
        const next = [...prev];
        for (const u of updated) {
          const idx = next.findIndex((s) => s.key === u.key);
          if (idx >= 0) next[idx] = u;
          else next.push(u);
        }
        return next;
      });
      // Clear saved values
      setEditing((prev) => {
        const next = { ...prev };
        for (const item of items) next[item.key] = '';
        return next;
      });
      message.success(`${provider} 配置已保存`);
    } catch (e: any) {
      message.error('保存失败: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
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
        {/* Header */}
        <Space align="center" style={{ marginBottom: 32 }}>
          <Link to="/">
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              style={{ color: '#94a3b8' }}
            />
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
            <Title level={4} style={{ margin: 0, color: '#e2e8f0' }}>API 配置</Title>
            <Text type="secondary">管理 Seedance 及其他 LLM 的 API 密钥</Text>
          </div>
        </Space>

        {/* Provider Cards */}
        {PROVIDERS.map((provider) => {
          const providerSettings = settings.filter((s) => s.provider === provider.provider);
          return (
            <Card
              key={provider.provider}
              style={{
                marginBottom: 20,
                background: '#131330',
                borderColor: '#1e1e4a',
                borderRadius: 12,
              }}
              title={
                <Space>
                  {provider.icon}
                  <span style={{ color: '#e2e8f0', fontSize: 15, fontWeight: 600 }}>
                    {provider.title}
                  </span>
                </Space>
              }
            >
              <Space direction="vertical" size={16} style={{ width: '100%' }}>
                {provider.fields.map((field) => {
                  const current = providerSettings.find((s) => s.key === field.key);
                  return (
                    <div key={field.key}>
                      <Text style={{ display: 'block', marginBottom: 6, color: '#94a3b8', fontSize: 13 }}>
                        {field.label}
                      </Text>
                      {field.masked && current ? (
                        <Input.Password
                          placeholder={current.value}
                          value={editing[field.key] ?? ''}
                          onChange={(e) =>
                            setEditing((prev) => ({ ...prev, [field.key]: e.target.value }))
                          }
                          style={{
                            background: '#0a0a1a',
                            borderColor: '#1e1e4a',
                            color: '#e2e8f0',
                          }}
                        />
                      ) : (
                        <Input
                          placeholder={current?.value ?? ''}
                          value={editing[field.key] ?? ''}
                          onChange={(e) =>
                            setEditing((prev) => ({ ...prev, [field.key]: e.target.value }))
                          }
                          style={{
                            background: '#0a0a1a',
                            borderColor: '#1e1e4a',
                            color: '#e2e8f0',
                          }}
                        />
                      )}
                    </div>
                  );
                })}
                <Button
                  type="primary"
                  icon={<ApiOutlined />}
                  loading={saving}
                  onClick={() => handleSave(provider.provider)}
                  style={{ borderRadius: 8, marginTop: 4 }}
                >
                  保存 {provider.title} 配置
                </Button>
              </Space>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
