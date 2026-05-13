import { memo, useState, useEffect, useRef } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import {
  PlayCircleOutlined,
  LoadingOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import MDEditor from '@uiw/react-md-editor';
import { getShotVideoUrl } from '../../api/client';

const statusIcons: Record<string, React.ReactNode> = {
  draft: <PlayCircleOutlined style={{ color: '#64748b', fontSize: 15 }} />,
  queued: <ClockCircleOutlined style={{ color: '#fbbf24', fontSize: 15 }} />,
  generating: <LoadingOutlined style={{ color: '#4f7cff', fontSize: 15 }} spin />,
  completed: <CheckCircleOutlined style={{ color: '#34d399', fontSize: 15 }} />,
  failed: <CloseCircleOutlined style={{ color: '#f87171', fontSize: 15 }} />,
};

const statusStyle: Record<string, React.CSSProperties> = {
  draft: { borderColor: '#1e1e4a', background: '#131330' },
  queued: { borderColor: '#78350f', background: 'rgba(251, 191, 36, 0.06)' },
  generating: { borderColor: '#1e3a5f', background: 'rgba(79, 124, 255, 0.06)' },
  completed: { borderColor: '#064e3b', background: 'rgba(52, 211, 153, 0.06)' },
  failed: { borderColor: '#7f1d1d', background: 'rgba(248, 113, 113, 0.06)' },
};

function ShotNode({ data, selected }: NodeProps) {
  const status: string = data.status ?? 'draft';
  const progress: number = data.progress ?? 0;
  const base = statusStyle[status] ?? statusStyle.draft;
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (status === 'completed' && data.shotId) {
      getShotVideoUrl(data.shotId)
        .then(setVideoUrl)
        .catch(() => {});
    } else {
      setVideoUrl(null);
      setPlaying(false);
    }
  }, [status, data.shotId]);

  const handleVideoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    if (playing) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setPlaying(!playing);
  };

  return (
    <div
      style={{
        padding: '12px 16px',
        borderRadius: 12,
        border: '2px solid transparent',
        minWidth: 200,
        background: '#131330',
        boxShadow: selected
          ? '0 0 0 2px rgba(79, 124, 255, 0.5), 0 4px 20px rgba(0,0,0,0.3)'
          : '0 2px 10px rgba(0,0,0,0.2)',
        transition: 'box-shadow 0.2s',
        ...base,
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: '#475569', width: 10, height: 10 }}
      />
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 4,
        }}
      >
        <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>#{data.order}</span>
        {statusIcons[status]}
      </div>

      {/* Video thumbnail (click to play) */}
      {videoUrl && (
        <div
          onClick={handleVideoClick}
          style={{
            position: 'relative',
            borderRadius: 6,
            overflow: 'hidden',
            cursor: 'pointer',
            marginBottom: 6,
          }}
        >
          <video
            ref={videoRef}
            src={videoUrl}
            muted
            playsInline
            style={{
              width: '100%',
              height: 70,
              objectFit: 'cover',
              display: 'block',
              borderRadius: 6,
            }}
          />
          {!playing && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(0,0,0,0.35)',
                borderRadius: 6,
              }}
            >
              <PlayCircleOutlined style={{ fontSize: 24, color: '#fff' }} />
            </div>
          )}
        </div>
      )}

      <div
        style={{
          fontSize: 13,
          lineHeight: 1.4,
          color: '#cbd5e1',
          overflow: 'hidden',
        }}
      >
        {data.promptPreview ? (
          <MDEditor.Markdown
            source={data.promptPreview}
            style={{ fontSize: 13, background: 'transparent', color: '#cbd5e1' }}
          />
        ) : (
          '空提示词'
        )}
      </div>
      {status === 'generating' && (
        <div
          style={{
            marginTop: 10,
            width: '100%',
            background: '#1e1e4a',
            borderRadius: 99,
            height: 6,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              background: 'linear-gradient(90deg, #4f7cff, #6366f1)',
              height: '100%',
              borderRadius: 99,
              width: `${progress}%`,
              transition: 'width 0.5s',
            }}
          />
        </div>
      )}
      {status === 'failed' && data.errorPreview && (
        <div
          style={{
            fontSize: 11,
            color: '#f87171',
            marginTop: 6,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {data.errorPreview}
        </div>
      )}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: '#475569', width: 10, height: 10 }}
      />
    </div>
  );
}

export default memo(ShotNode);
