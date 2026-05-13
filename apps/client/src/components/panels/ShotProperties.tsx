import { useState, useEffect } from 'react';
import { Input, Select, InputNumber, Button, Typography, Tag, message, Progress } from 'antd';
import { CameraOutlined, ThunderboltOutlined, ReloadOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useProject } from '../../context/ProjectContext';
import { api, getShotVideoUrl } from '../../api/client';

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
  { value: 'doubao-seedance-2-0-fast-260128', label: 'doubao-seedance-2-0-fast-260128' },
  { value: 'doubao-seedance-2-0-260128', label: 'doubao-seedance-2-0-260128' },
];

const transitionOptions = [
  { value: 'cut', label: '硬切' },
  { value: 'dissolve', label: '叠化' },
  { value: 'fade', label: '淡入淡出' },
  { value: 'wipe', label: '擦除' },
  { value: 'none', label: '无' },
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
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  useEffect(() => {
    setLocalPrompt(shot?.prompt ?? '');
  }, [shot?.prompt]);

  // Fetch presigned URL when generation completes
  useEffect(() => {
    if (shot?.generation?.status === 'completed') {
      getShotVideoUrl(shotId).then(setVideoUrl).catch(() => setVideoUrl(null));
    }
  }, [shot?.generation?.status, shotId]);

  if (!shot) return null;

  const update = async (field: string, value: unknown) => {
    const updated = await api.updateShot(shotId, { [field]: value });
    dispatch({
      type: 'UPDATE_PROJECT',
      payload: { shots: state.project!.shots.map((s) => (s.id === shotId ? { ...s, ...updated } : s)) },
    });
  };

  const outgoingEdge = state.project?.edges.find((e) => e.sourceShotId === shotId);

  const updateEdge = async (field: string, value: unknown) => {
    if (!outgoingEdge) return;
    const updated = await api.updateEdge(outgoingEdge.id, { [field]: value });
    dispatch({
      type: 'UPDATE_PROJECT',
      payload: {
        edges: state.project!.edges.map((e) =>
          e.id === outgoingEdge.id ? { ...e, ...updated } : e,
        ),
      },
    });
  };

  const handleGenerate = async () => {
    try {
      const task = await api.generateShot(shotId);
      dispatch({
        type: 'UPDATE_PROJECT',
        payload: {
          shots: state.project!.shots.map((s) =>
            s.id === shotId ? { ...s, generation: task } : s,
          ),
        },
      });
    } catch (err: any) {
      message.error(`生成失败: ${err.message}`);
    }
  };

  const handleRetry = async () => {
    try {
      const task = await api.generateShot(shotId);
      dispatch({
        type: 'UPDATE_PROJECT',
        payload: {
          shots: state.project!.shots.map((s) =>
            s.id === shotId ? { ...s, generation: task } : s,
          ),
        },
      });
    } catch (err: any) {
      message.error(`重试失败: ${err.message}`);
    }
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

      {/* Transition out */}
      <fieldset style={{ border: '1px solid #1e1e4a', borderRadius: 10, padding: '12px 16px', margin: 0 }}>
        <legend style={{ color: '#64748b', fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', padding: '0 4px' }}>
          转场到下一镜
        </legend>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Label text="转场类型">
            <Select
              value={outgoingEdge?.transitionType}
              onChange={(v) => updateEdge('transitionType', v)}
              style={formStyle}
              options={transitionOptions}
              disabled={!outgoingEdge}
            />
          </Label>
          {outgoingEdge &&
            outgoingEdge.transitionType !== 'cut' &&
            outgoingEdge.transitionType !== 'none' && (
              <Label text="时长 (秒)">
                <InputNumber
                  value={outgoingEdge.transitionDuration}
                  min={0}
                  max={5}
                  step={0.1}
                  onChange={(v) => updateEdge('transitionDuration', v ?? 0)}
                  style={formStyle}
                />
              </Label>
            )}
        </div>
      </fieldset>

      {/* Actions / Status / Preview */}
      {genStatus === 'completed' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#34d399', fontSize: 13 }}>
            <CheckCircleOutlined /> 生成完成
          </div>
          {videoUrl ? (
          <video
            key={shot.generation?.id}
            controls
            src={videoUrl}
            style={{
              width: '100%',
              borderRadius: 8,
              background: '#000',
              border: '1px solid #1e1e4a',
            }}
          />
          ) : (
          <div style={{ color: '#64748b', fontSize: 12, textAlign: 'center', padding: 12 }}>
            获取视频地址中...
          </div>
          )}
          <Button
            block
            icon={<ReloadOutlined />}
            onClick={handleRetry}
            style={{
              background: '#1a1a40',
              border: '1px solid #2a2a5a',
              color: '#94a3b8',
              borderRadius: 8,
            }}
          >
            重新生成
          </Button>
        </div>
      ) : genStatus === 'failed' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {shot.generation?.errorMessage && (
            <div
              style={{
                background: 'rgba(248, 113, 113, 0.1)',
                border: '1px solid #7f1d1d',
                borderRadius: 8,
                padding: '10px 12px',
                fontSize: 12,
                color: '#f87171',
                lineHeight: 1.5,
                wordBreak: 'break-word',
              }}
            >
              {shot.generation.errorMessage}
            </div>
          )}
          <Button type="primary" danger block icon={<ReloadOutlined />} onClick={handleRetry}>
            重新生成
          </Button>
        </div>
      ) : genStatus === 'queued' || genStatus === 'generating' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Text style={{ color: '#4f7cff', fontSize: 13 }}>
            {genStatus === 'queued' ? '排队中...' : `生成中... ${shot.generation?.progress ?? 0}%`}
          </Text>
          <Progress
            percent={shot.generation?.progress ?? 0}
            showInfo={false}
            strokeColor={{ '0%': '#4f7cff', '100%': '#6366f1' }}
            trailColor="#1e1e4a"
          />
        </div>
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
