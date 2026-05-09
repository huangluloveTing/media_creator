import { Input, Select, InputNumber, Typography } from 'antd';
import { ArrowRightOutlined } from '@ant-design/icons';
import { useProject } from '../../context/ProjectContext';
import { api } from '../../api/client';

const { Text, Title } = Typography;

const transitionOptions = [
  { value: 'cut', label: '硬切' },
  { value: 'dissolve', label: '叠化' },
  { value: 'fade', label: '淡入淡出' },
  { value: 'wipe', label: '擦除' },
  { value: 'none', label: '无' },
];

const formStyle: React.CSSProperties = {
  width: '100%',
  background: '#131330',
  borderColor: '#1e1e4a',
  color: '#e2e8f0',
};

export default function EdgeProperties({ edgeId }: { edgeId: string }) {
  const { state, dispatch } = useProject();
  const edge = state.project?.edges.find((e) => e.id === edgeId);
  if (!edge) return null;

  const update = async (field: string, value: unknown) => {
    const updated = await api.updateEdge(edgeId, { [field]: value });
    dispatch({
      type: 'UPDATE_PROJECT',
      payload: { edges: state.project!.edges.map((e) => (e.id === edgeId ? { ...e, ...updated } : e)) },
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div
          style={{
            width: 28, height: 28, borderRadius: 8,
            background: 'rgba(251, 191, 36, 0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <ArrowRightOutlined style={{ color: '#fbbf24', fontSize: 14 }} />
        </div>
        <Title level={5} style={{ margin: 0, color: '#e2e8f0' }}>
          连线属性
        </Title>
      </div>

      <Label text="转场类型">
        <Select value={edge.transitionType} onChange={(v) => update('transitionType', v)}
          style={formStyle} options={transitionOptions} />
      </Label>

      {edge.transitionType !== 'cut' && edge.transitionType !== 'none' && (
        <Label text="时长 (秒)">
          <InputNumber value={edge.transitionDuration}
            min={0} max={5} step={0.1}
            onChange={(v) => update('transitionDuration', v ?? 0)}
            style={formStyle} />
        </Label>
      )}

      <Label text="字幕文本">
        <Input value={edge.subtitleText ?? ''}
          placeholder="例如：三天后..."
          onChange={(e) => update('subtitleText', e.target.value || null)}
          style={formStyle} />
      </Label>
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
