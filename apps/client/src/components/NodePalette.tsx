import { useMemo } from 'react';
import { Button, Typography, message, Progress } from 'antd';
import {
  ThunderboltOutlined,
  ClockCircleOutlined,
  LoadingOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { useProject } from '../context/ProjectContext';
import { api } from '../api/client';

const { Text } = Typography;

const STATUSES = [
  { key: 'queued', label: '排队中', color: '#fbbf24', icon: <ClockCircleOutlined /> },
  { key: 'generating', label: '生成中', color: '#4f7cff', icon: <LoadingOutlined spin /> },
  { key: 'completed', label: '已完成', color: '#34d399', icon: <CheckCircleOutlined /> },
  { key: 'failed', label: '失败', color: '#f87171', icon: <CloseCircleOutlined /> },
] as const;

export default function NodePalette() {
  const { state, dispatch } = useProject();

  const stats = useMemo(() => {
    const counts: Record<string, number> = {
      queued: 0,
      generating: 0,
      completed: 0,
      failed: 0,
      draft: 0,
    };
    let weighted = 0;
    const shots = state.project?.shots ?? [];
    for (const s of shots) {
      const status = s.generation?.status ?? 'draft';
      counts[status] = (counts[status] ?? 0) + 1;
      if (status === 'completed') weighted += 100;
      else if (status === 'generating' || status === 'queued')
        weighted += s.generation?.progress ?? 0;
    }
    const total = shots.length;
    return { counts, total, overall: total === 0 ? 0 : Math.round(weighted / total) };
  }, [state.project?.shots]);

  const handleGenerateAll = async () => {
    if (!state.project) return;
    dispatch({ type: 'SET_GENERATING', payload: true });
    try {
      await api.generateAll(state.project.id);
      // Refresh to pick up newly queued tasks immediately so polling starts
      const full = await api.getProjectFull(state.project.id);
      dispatch({ type: 'SET_PROJECT', payload: full });
    } catch (err: any) {
      message.error(`批量生成失败: ${err.message}`);
    }
  };

  const shotCount = state.project?.shots.length ?? 0;
  const hasActive = stats.counts.queued > 0 || stats.counts.generating > 0;

  return (
    <div
      style={{
        width: 220,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        padding: 16,
        background: '#0d0d2b',
        borderRight: '1px solid #1e1e4a',
        flexShrink: 0,
        overflow: 'auto',
      }}
    >
      <div>
        <Text
          style={{
            color: '#475569',
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            display: 'block',
            marginBottom: 8,
          }}
        >
          操作
        </Text>
        <Button
          block
          type="primary"
          icon={<ThunderboltOutlined />}
          onClick={handleGenerateAll}
          disabled={shotCount === 0}
          loading={hasActive}
          style={{
            height: 38,
            borderRadius: 8,
            background: 'linear-gradient(135deg, #4f7cff, #6366f1)',
            border: 'none',
            fontWeight: 600,
          }}
        >
          {hasActive ? '生成中...' : '全部生成'}
        </Button>
      </div>

      <div>
        <Text
          style={{
            color: '#475569',
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            display: 'block',
            marginBottom: 10,
          }}
        >
          队列状态
        </Text>

        <div
          style={{
            background: '#131330',
            border: '1px solid #1e1e4a',
            borderRadius: 10,
            padding: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Text style={{ color: '#94a3b8', fontSize: 12 }}>总进度</Text>
            <Text style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 600 }}>
              {stats.overall}%
            </Text>
          </div>
          <Progress
            percent={stats.overall}
            showInfo={false}
            strokeColor={
              stats.counts.failed > 0
                ? { '0%': '#f87171', '100%': '#fbbf24' }
                : { '0%': '#4f7cff', '100%': '#6366f1' }
            }
            trailColor="#1e1e4a"
            size="small"
          />

          <div style={{ height: 1, background: '#1e1e4a', margin: '4px 0' }} />

          {STATUSES.map((s) => (
            <StatRow
              key={s.key}
              label={s.label}
              count={stats.counts[s.key] ?? 0}
              color={s.color}
              icon={s.icon}
              dim={(stats.counts[s.key] ?? 0) === 0}
            />
          ))}

          <div style={{ height: 1, background: '#1e1e4a', margin: '4px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Text style={{ color: '#64748b', fontSize: 12 }}>共</Text>
            <Text style={{ color: '#94a3b8', fontSize: 12 }}>{stats.total} 个分镜</Text>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatRow({
  label,
  count,
  color,
  icon,
  dim,
}: {
  label: string;
  count: number;
  color: string;
  icon: React.ReactNode;
  dim: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        opacity: dim ? 0.4 : 1,
        transition: 'opacity 0.2s',
      }}
    >
      <span style={{ color, fontSize: 13, lineHeight: 1, width: 14 }}>{icon}</span>
      <Text style={{ color: '#94a3b8', fontSize: 12, flex: 1 }}>{label}</Text>
      <Text style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
        {count}
      </Text>
    </div>
  );
}
