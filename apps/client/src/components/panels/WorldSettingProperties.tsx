import { Button, Input, Typography } from 'antd';
import { GlobalOutlined } from '@ant-design/icons';
import { useProject } from '../../context/ProjectContext';
import { api } from '../../api/client';
import type { PrepNode, WorldSettingData } from '../../types';

const { Text, Title } = Typography;

function parseLines(value: string): string[] {
  return value
    .split(/\n|,|，/)
    .map((x) => x.trim())
    .filter(Boolean);
}

export default function WorldSettingProperties() {
  const { state, dispatch } = useProject();
  const project = state.project;
  if (!project) return null;

  const prepNodes: PrepNode[] = (project as any).prepNodes ?? [];
  const nodeIndex = prepNodes.findIndex((pn) => pn.type === 'world_setting');
  const node = nodeIndex >= 0 ? prepNodes[nodeIndex] : null;
  const data: WorldSettingData = (node?.data as WorldSettingData) ?? {
    era: '',
    location: '',
    atmosphere: [],
    rules: [],
    visualStyle: '',
  };

  const updateData = async (patch: Partial<WorldSettingData>) => {
    const nextData = { ...data, ...patch };
    const nextNode: PrepNode = {
      id: `prep-world_setting-${node?.order ?? prepNodes.length}`,
      type: 'world_setting',
      status: 'drafting',
      order: node?.order ?? prepNodes.length,
      data: nextData,
    };
    const nextNodes =
      nodeIndex >= 0
        ? prepNodes.map((pn, i) => (i === nodeIndex ? nextNode : pn))
        : [...prepNodes, nextNode];
    const updated = await api.updateProject(project.id, { prepNodes: nextNodes as any } as any);
    dispatch({ type: 'UPDATE_PROJECT', payload: updated as any });
  };

  const confirm = () => {
    if (!node) return;
    const confirmedNode = { ...node, status: 'confirmed' as const };
    const nextNodes = prepNodes.map((pn) => (pn.type === 'world_setting' ? confirmedNode : pn));
    api.updateProject(project.id, { prepNodes: nextNodes as any } as any).then((updated) => {
      dispatch({ type: 'UPDATE_PROJECT', payload: updated as any });
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <GlobalOutlined style={{ color: '#22c55e' }} />
        <Title level={5} style={{ margin: 0, color: '#e2e8f0' }}>
          世界观设定
        </Title>
      </div>
      <Label text="时代背景">
        <Input
          value={data.era}
          onChange={(e) => updateData({ era: e.target.value })}
          style={inputStyle}
        />
      </Label>
      <Label text="地点/场景">
        <Input
          value={data.location}
          onChange={(e) => updateData({ location: e.target.value })}
          style={inputStyle}
        />
      </Label>
      <Label text="氛围基调（逗号/换行分隔）">
        <Input.TextArea
          value={(data.atmosphere ?? []).join('\n')}
          onChange={(e) => updateData({ atmosphere: parseLines(e.target.value) })}
          rows={2}
          style={inputStyle}
        />
      </Label>
      <Label text="世界观规则（逗号/换行分隔）">
        <Input.TextArea
          value={(data.rules ?? []).join('\n')}
          onChange={(e) => updateData({ rules: parseLines(e.target.value) })}
          rows={2}
          style={inputStyle}
        />
      </Label>
      <Label text="视觉风格参考">
        <Input
          value={data.visualStyle ?? ''}
          onChange={(e) => updateData({ visualStyle: e.target.value })}
          style={inputStyle}
        />
      </Label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Button type="primary" onClick={confirm} disabled={!node}>
          确认世界观
        </Button>
        <Text style={{ color: node?.status === 'confirmed' ? '#22c55e' : '#f59e0b', fontSize: 12 }}>
          {node?.status === 'confirmed' ? '已确认' : '未确认'}
        </Text>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: '#131330',
  borderColor: '#1e1e4a',
  color: '#e2e8f0',
};

function Label({ text, children }: { text: string; children: React.ReactNode }) {
  return (
    <div>
      <Text
        style={{
          color: '#64748b',
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          display: 'block',
          marginBottom: 6,
        }}
      >
        {text}
      </Text>
      {children}
    </div>
  );
}
