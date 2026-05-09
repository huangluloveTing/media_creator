import { useState, useEffect } from 'react';
import { Input, Select, InputNumber, Button, Typography, Tag, message } from 'antd';
import { CameraOutlined, ThunderboltOutlined, ReloadOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useProject } from '../../context/ProjectContext';
import { api } from '../../api/client';

const { Text, Title } = Typography;

const shotSizeOptions = [
  { value: 'extreme-wide', label: '极远景' },
  { value: 'wide', label: '远景' },
  { value: 'medium', label: '中景' },
  { value: 'close-up', label: '特写' },
  { value: 'extreme-close-up', label: '大特写' },
];
const angleOptions = [
  { value: 'eye-level', label: '平视' },
  { value: 'low', label: '仰拍' },
  { value: 'high', label: '俯拍' },
  { value: 'dutch', label: '倾斜' },
  { value: 'aerial', label: '航拍' },
];
const movementOptions = [
  { value: 'static', label: '静止' },
  { value: 'pan', label: '横摇' },
  { value: 'tilt', label: '纵摇' },
  { value: 'dolly', label: '推拉' },
  { value: 'zoom', label: '变焦' },
  { value: 'handheld', label: '手持' },
];
const modelOptions = [
  { value: 'seedance-2.0', label: 'seedance-2.0' },
  { value: 'seedance-2.0-fast', label: 'seedance-2.0-fast' },
  { value: 'seedance-1.5-pro', label: 'seedance-1.5-pro' },
];

const statusConfig: Record<string, { label: string; color: string }> = {
  draft: { label: '草稿', color: 'default' },
  queued: { label: '排队中', color: 'blue' },
  generating: { label: '生成中', color: 'processing' },
  completed: { label: '已完成', color: 'success' },
  failed: { label: '失败', color: 'error' },
};

const formStyle: React.CSSProperties = {
  width: '100%',
  background: '#131330',
  borderColor: '#1e1e4a',
  color: '#e2e8f0',
};

export default function ShotProperties({ shotId }: { shotId: string }) {
  const { state, dispatch } = useProject();
  const shot = state.project?.shots.find((s) => s.id === shotId);
  const [localPrompt, setLocalPrompt] = useState(shot?.prompt ?? '');

  useEffect(() => {
    setLocalPrompt(shot?.prompt ?? '');
  }, [shot?.prompt]);

  if (!shot) return null;

  const update = async (field: string, value: unknown) => {
    const updated = await api.updateShot(shotId, { [field]: value });
    dispatch({
      type: 'UPDATE_PROJECT',
      payload: { shots: state.project!.shots.map((s) => (s.id === shotId ? { ...s, ...updated } : s)) },
    });
  };

  const handleGenerate = async () => {
    try { await api.generateShot(shotId); } catch (err: any) { message.error(`生成失败: ${err.message}`); }
  };

  const handleRetry = async () => {
    try { await api.generateShot(shotId); } catch (err: any) { message.error(`重试失败: ${err.message}`); }
  };

  const genStatus = shot.generation?.status;
  const genConfig = genStatus ? (statusConfig[genStatus] ?? statusConfig.draft) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 28, height: 28, borderRadius: 8,
              background: 'rgba(79, 124, 255, 0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <CameraOutlined style={{ color: '#4f7cff', fontSize: 14 }} />
          </div>
          <Title level={5} style={{ margin: 0, color: '#e2e8f0' }}>
            镜头 #{shot.order}
          </Title>
        </div>
        {genConfig && <Tag color={genConfig.color}>{genConfig.label}</Tag>}
      </div>

      {/* Prompt */}
      <Label text="提示词">
        <Input.TextArea
          value={localPrompt}
          onChange={(e) => setLocalPrompt(e.target.value)}
          onBlur={() => update('prompt', localPrompt)}
          placeholder="描述镜头内容..."
          rows={4}
          style={{ ...formStyle, background: '#131330', borderColor: '#1e1e4a' }}
        />
      </Label>

      {/* Camera */}
      <fieldset style={{ border: '1px solid #1e1e4a', borderRadius: 10, padding: '12px 16px', margin: 0 }}>
        <legend style={{ color: '#64748b', fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', padding: '0 4px' }}>
          镜头参数
        </legend>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Label text="景别">
            <Select value={shot.shotSize} onChange={(v) => update('shotSize', v)} style={formStyle} options={shotSizeOptions} />
          </Label>
          <Label text="角度">
            <Select value={shot.angle} onChange={(v) => update('angle', v)} style={formStyle} options={angleOptions} />
          </Label>
          <Label text="运动">
            <Select value={shot.movement} onChange={(v) => update('movement', v)} style={formStyle} options={movementOptions} />
          </Label>
          <Label text="时长 (秒)">
            <InputNumber value={shot.duration} min={4} max={15} step={1} onChange={(v) => update('duration', v ?? 5)} style={formStyle} />
          </Label>
        </div>
      </fieldset>

      {/* Model */}
      <fieldset style={{ border: '1px solid #1e1e4a', borderRadius: 10, padding: '12px 16px', margin: 0 }}>
        <legend style={{ color: '#64748b', fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', padding: '0 4px' }}>
          生成参数
        </legend>
        <Label text="模型">
          <Select value={shot.model} onChange={(v) => update('model', v)} style={formStyle} options={modelOptions} />
        </Label>
      </fieldset>

      {/* Actions */}
      {genStatus === 'failed' ? (
        <Button type="primary" danger block icon={<ReloadOutlined />} onClick={handleRetry}>
          重新生成
        </Button>
      ) : genStatus === 'completed' ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#34d399', fontSize: 13 }}>
          <CheckCircleOutlined /> 生成完成
        </div>
      ) : genStatus === 'generating' ? (
        <Text style={{ color: '#4f7cff', fontSize: 13 }}>生成中... {shot.generation?.progress ?? 0}%</Text>
      ) : (
        <Button
          type="primary"
          block
          icon={<ThunderboltOutlined />}
          onClick={handleGenerate}
          style={{
            background: 'linear-gradient(135deg, #4f7cff, #6366f1)',
            border: 'none',
            height: 38,
            fontWeight: 600,
          }}
        >
          生成此镜头
        </Button>
      )}
    </div>
  );
}

function Label({ text, children }: { text: string; children: React.ReactNode }) {
  return (
    <div>
      <Text style={{ color: '#64748b', fontSize: 11, display: 'block', marginBottom: 4 }}>
        {text}
      </Text>
      {children}
    </div>
  );
}
