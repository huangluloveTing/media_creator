import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, Input, Button, Space, Typography, message, Spin } from 'antd';
import { SettingOutlined, ArrowLeftOutlined, ApiOutlined, CloudOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { api } from '../api/client';
import type { Setting } from '../types';

const { Title, Text } = Typography;

const SEEDANCE_API_KEY = 'seedance.apiKey';
const LLM_API_KEY = 'llm.apiKey';
const LLM_MODEL = 'llm.model';
const LLM_BASE_URL = 'llm.baseUrl';

const LLM_CONFIG_KEYS = [LLM_API_KEY, LLM_MODEL, LLM_BASE_URL];

export default function SettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [seedanceEditing, setSeedanceEditing] = useState('');
  const [llmConfig, setLlmConfig] = useState({ apiKey: '', model: '', baseUrl: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .getSettings()
      .then((list) => {
        setSettings(list);
        const getValue = (key: string) => list.find((s) => s.key === key)?.value ?? '';
        setSeedanceEditing(getValue(SEEDANCE_API_KEY));
        setLlmConfig({
          apiKey: getValue(LLM_API_KEY),
          model: getValue(LLM_MODEL),
          baseUrl: getValue(LLM_BASE_URL),
        });
      })
      .catch((e) => message.error('加载配置失败: ' + e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleSaveSeedance = async () => {
    if (!seedanceEditing) return;
    setSaving(true);
    try {
      const [updated] = await api.updateSettings([{ key: SEEDANCE_API_KEY, value: seedanceEditing }]);
      setSettings((prev) =>
        updated
          ? prev.map((s) => (s.key === SEEDANCE_API_KEY ? updated : s))
          : prev.filter((s) => s.key !== SEEDANCE_API_KEY),
      );
      message.success('Seedance 配置已保存');
    } catch (e: any) {
      message.error('保存失败: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveLlm = async () => {
    if (!llmConfig.apiKey) {
      message.warning('请填写 API Key');
      return;
    }
    setSaving(true);
    try {
      const items = [
        { key: LLM_API_KEY, value: llmConfig.apiKey },
        { key: LLM_MODEL, value: llmConfig.model || 'gpt-4o' },
        { key: LLM_BASE_URL, value: llmConfig.baseUrl },
      ];
      const updated = await api.updateSettings(items);
      setSettings((prev) => {
        const map = new Map(updated.map((s) => [s.key, s]));
        return prev.map((s) => map.get(s.key) ?? s);
      });
      message.success('LLM 配置已保存');
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
            <Text type="secondary">配置 API Key 和 LLM 模型参数</Text>
          </div>
        </Space>

        {/* Seedance Card */}
        <Card
          style={{
            background: '#131330',
            borderColor: '#1e1e4a',
            borderRadius: 12,
            marginBottom: 16,
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
                placeholder="请输入 Seedance API Key"
                value={seedanceEditing}
                onChange={(e) => setSeedanceEditing(e.target.value)}
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
              disabled={!seedanceEditing}
              onClick={handleSaveSeedance}
              style={{ borderRadius: 8, marginTop: 4 }}
            >
              保存配置
            </Button>
          </Space>
        </Card>

        {/* LLM Card */}
        <Card
          style={{
            background: '#131330',
            borderColor: '#1e1e4a',
            borderRadius: 12,
          }}
          title={
            <Space>
              <ThunderboltOutlined style={{ fontSize: 22, color: '#a78bfa' }} />
              <span style={{ color: '#e2e8f0', fontSize: 15, fontWeight: 600 }}>
                LLM 提示词优化
              </span>
            </Space>
          }
        >
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <div>
              <Text style={{ display: 'block', marginBottom: 6, color: '#94a3b8', fontSize: 13 }}>
                API Key
              </Text>
              <Input.Password
                placeholder="请输入 LLM API Key"
                value={llmConfig.apiKey}
                onChange={(e) => setLlmConfig((p) => ({ ...p, apiKey: e.target.value }))}
                style={{
                  background: '#0a0a1a',
                  borderColor: '#1e1e4a',
                  color: '#e2e8f0',
                }}
              />
            </div>
            <div>
              <Text style={{ display: 'block', marginBottom: 6, color: '#94a3b8', fontSize: 13 }}>
                模型
              </Text>
              <Input
                placeholder="例如 gpt-4o、deepseek-chat"
                value={llmConfig.model}
                onChange={(e) => setLlmConfig((p) => ({ ...p, model: e.target.value }))}
                style={{
                  background: '#0a0a1a',
                  borderColor: '#1e1e4a',
                  color: '#e2e8f0',
                }}
              />
            </div>
            <div>
              <Text style={{ display: 'block', marginBottom: 6, color: '#94a3b8', fontSize: 13 }}>
                Base URL
              </Text>
              <Input
                placeholder="留空使用 OpenAI 默认地址"
                value={llmConfig.baseUrl}
                onChange={(e) => setLlmConfig((p) => ({ ...p, baseUrl: e.target.value }))}
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
              disabled={!llmConfig.apiKey}
              onClick={handleSaveLlm}
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
