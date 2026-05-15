import { Button, Input, InputNumber, Typography } from 'antd';
import { BookOutlined } from '@ant-design/icons';
import { useProject } from '../../context/ProjectContext';
import { api } from '../../api/client';
import type { PrepNode, StoryOutlineData } from '../../types';

const { Text, Title } = Typography;

function parseLines(value: string): string[] {
  return value
    .split(/\n|,|，/)
    .map((x) => x.trim())
    .filter(Boolean);
}

export default function StoryOutlineProperties() {
  const { state, dispatch } = useProject();
  const project = state.project;
  if (!project) return null;

  const prepNodes: PrepNode[] = (project as any).prepNodes ?? [];
  const nodeIndex = prepNodes.findIndex((pn) => pn.type === 'story_outline');
  const node = nodeIndex >= 0 ? prepNodes[nodeIndex] : null;
  const data: StoryOutlineData = (node?.data as StoryOutlineData) ?? {
    premise: '',
    plotBeats: [],
    tone: '',
    targetShotCount: 5,
  };

  const updateData = async (patch: Partial<StoryOutlineData>) => {
    const nextData = { ...data, ...patch };
    const nextNode: PrepNode = {
      id: `prep-story_outline-${node?.order ?? prepNodes.length}`,
      type: 'story_outline',
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
    const nextNodes = prepNodes.map((pn) => (pn.type === 'story_outline' ? confirmedNode : pn));
    api.updateProject(project.id, { prepNodes: nextNodes as any } as any).then((updated) => {
      dispatch({ type: 'UPDATE_PROJECT', payload: updated as any });
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <BookOutlined style={{ color: '#22c55e' }} />
        <Title level={5} style={{ margin: 0, color: '#e2e8f0' }}>
          故事梗概
        </Title>
      </div>
      <Label text="故事前提">
        <Input.TextArea
          value={data.premise}
          onChange={(e) => updateData({ premise: e.target.value })}
          rows={3}
          style={inputStyle}
        />
      </Label>
      <Label text="关键情节点（每行一个）">
        <Input.TextArea
          value={(data.plotBeats ?? []).join('\n')}
          onChange={(e) => updateData({ plotBeats: parseLines(e.target.value) })}
          rows={4}
          style={inputStyle}
        />
      </Label>
      <Label text="叙事调性">
        <Input
          value={data.tone ?? ''}
          onChange={(e) => updateData({ tone: e.target.value })}
          style={inputStyle}
        />
      </Label>
      <Label text="目标镜头数">
        <InputNumber
          value={data.targetShotCount ?? 5}
          onChange={(v) => updateData({ targetShotCount: v ?? 5 })}
          min={1}
          max={10}
          style={{ width: '100%' }}
        />
      </Label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Button type="primary" onClick={confirm} disabled={!node}>
          确认故事梗概
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
