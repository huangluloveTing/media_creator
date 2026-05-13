import { useState, useEffect, useCallback } from 'react';
import { Input, Button, Slider, Typography, message, Spin } from 'antd';
import { MergeCellsOutlined, DownloadOutlined, ReloadOutlined } from '@ant-design/icons';
import { useProject } from '../../context/ProjectContext';
import { api } from '../../api/client';

const { Text, Title } = Typography;

const formStyle: React.CSSProperties = {
  width: '100%',
  background: '#131330',
  borderColor: '#1e1e4a',
  color: '#e2e8f0',
};

const videoContainerStyle: React.CSSProperties = {
  width: '100%',
  aspectRatio: '16 / 9',
  borderRadius: 8,
  overflow: 'hidden',
  background: '#000',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

export default function MergeProperties() {
  const { state, dispatch } = useProject();
  const project = state.project;
  const [merging, setMerging] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loadingVideo, setLoadingVideo] = useState(false);

  if (!project) return null;

  const update = async (field: string, value: unknown) => {
    const updated = await api.updateProject(project.id, { [field]: value });
    dispatch({ type: 'UPDATE_PROJECT', payload: updated });
  };

  const loadFinalVideo = useCallback(async () => {
    if (!project.finalVideoKey) return;
    setLoadingVideo(true);
    try {
      const result = await api.getFinalVideoUrl(project.id);
      setVideoUrl(result.url);
    } catch {
      setVideoUrl(null);
    } finally {
      setLoadingVideo(false);
    }
  }, [project.id, project.finalVideoKey]);

  useEffect(() => {
    if (project.status === 'completed' && project.finalVideoKey) {
      loadFinalVideo();
    } else {
      setVideoUrl(null);
    }
  }, [project.status, project.finalVideoKey, loadFinalVideo]);

  const handleMerge = async () => {
    setMerging(true);
    try {
      const result = await api.merge(project.id);
      setVideoUrl(result.url);
      dispatch({ type: 'UPDATE_PROJECT', payload: { status: 'completed' } });
      message.success('合成完成！');
    } catch (err: any) {
      message.error(`合成失败: ${err.message}`);
    } finally {
      setMerging(false);
    }
  };

  const canMerge = project.status === 'ready_to_merge' || project.status === 'completed';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div
          style={{
            width: 28, height: 28, borderRadius: 8,
            background: 'rgba(168, 85, 247, 0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <MergeCellsOutlined style={{ color: '#a855f7', fontSize: 14 }} />
        </div>
        <Title level={5} style={{ margin: 0, color: '#e2e8f0' }}>
          导出设置
        </Title>
      </div>

      {videoUrl && (
        <div style={videoContainerStyle}>
          <video
            controls
            style={{ width: '100%', height: '100%' }}
            src={videoUrl}
          >
            您的浏览器不支持视频播放
          </video>
        </div>
      )}

      {loadingVideo && (
        <div style={videoContainerStyle}>
          <Spin />
        </div>
      )}

      {!videoUrl && !loadingVideo && project.status === 'completed' && (
        <div style={{ ...videoContainerStyle, background: '#0d0d2b' }}>
          <Text style={{ color: '#64748b', fontSize: 13 }}>
            合成结果不可用
          </Text>
        </div>
      )}

      <Label text="背景音乐 (路径)">
        <Input value={project.bgmPath ?? ''}
          placeholder="/path/to/bgm.mp3"
          onChange={(e) => update('bgmPath', e.target.value || null)}
          style={formStyle} />
      </Label>

      <Label text={`BGM 音量 — ${Math.round(project.bgmVolume * 100)}%`}>
        <Slider min={0} max={1} step={0.05} value={project.bgmVolume}
          onChange={(v) => update('bgmVolume', v)}
          trackStyle={{ background: '#a855f7' }} />
      </Label>

      <Label text={`原声音量 — ${Math.round(project.originalVolume * 100)}%`}>
        <Slider min={0} max={1} step={0.05} value={project.originalVolume}
          onChange={(v) => update('originalVolume', v)}
          trackStyle={{ background: '#a855f7' }} />
      </Label>

      <Button
        block
        type="primary"
        icon={project.status === 'completed' ? <ReloadOutlined /> : <DownloadOutlined />}
        onClick={handleMerge}
        disabled={merging}
        style={{
          height: 38,
          borderRadius: 8,
          background: canMerge ? 'linear-gradient(135deg, #a855f7, #6366f1)' : undefined,
          border: 'none',
          fontWeight: 600,
        }}
      >
        {merging ? '合成中...' : project.status === 'completed' ? '重新合成' : canMerge ? '合成导出' : '镜头未就绪'}
      </Button>
    </div>
  );
}

function Label({ text, children }: { text: string; children: React.ReactNode }) {
  return (
    <div>
      <Text style={{ color: '#64748b', fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
        {text}
      </Text>
      {children}
    </div>
  );
}
