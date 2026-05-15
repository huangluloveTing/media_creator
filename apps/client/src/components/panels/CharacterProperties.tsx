import { Button, Input, Typography } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { useProject } from '../../context/ProjectContext';
import { api } from '../../api/client';

const { Text, Title } = Typography;

function parseLines(value: string): string[] {
  return value
    .split(/\n|,|，/)
    .map((x) => x.trim())
    .filter(Boolean);
}

export default function CharacterProperties() {
  const { state, dispatch } = useProject();
  const project = state.project;
  if (!project) return null;

  const profile = (project.characterProfileJson as any) ?? {
    characterName: '',
    appearance: [],
    outfit: [],
    immutableTraits: [],
    confirmed: false,
  };

  const updateProfile = async (patch: Record<string, unknown>) => {
    const next = { ...profile, ...patch };
    const updated = await api.updateProject(project.id, { characterProfileJson: next } as any);
    dispatch({ type: 'UPDATE_PROJECT', payload: updated as any });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <UserOutlined style={{ color: '#22c55e' }} />
        <Title level={5} style={{ margin: 0, color: '#e2e8f0' }}>
          人物形象节点
        </Title>
      </div>

      <Label text="角色名">
        <Input
          value={profile.characterName ?? ''}
          onChange={(e) => updateProfile({ characterName: e.target.value, confirmed: false })}
          style={inputStyle}
        />
      </Label>

      <Label text="外观关键词（逗号/换行分隔）">
        <Input.TextArea
          value={(profile.appearance ?? []).join('\n')}
          onChange={(e) =>
            updateProfile({ appearance: parseLines(e.target.value), confirmed: false })
          }
          rows={3}
          style={inputStyle}
        />
      </Label>

      <Label text="服饰关键词（逗号/换行分隔）">
        <Input.TextArea
          value={(profile.outfit ?? []).join('\n')}
          onChange={(e) => updateProfile({ outfit: parseLines(e.target.value), confirmed: false })}
          rows={3}
          style={inputStyle}
        />
      </Label>

      <Label text="固定特征 / 禁改项（逗号/换行分隔）">
        <Input.TextArea
          value={(profile.immutableTraits ?? []).join('\n')}
          onChange={(e) =>
            updateProfile({ immutableTraits: parseLines(e.target.value), confirmed: false })
          }
          rows={3}
          style={inputStyle}
        />
      </Label>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Button type="primary" onClick={() => updateProfile({ confirmed: true })}>
          确认形象
        </Button>
        <Text style={{ color: profile.confirmed ? '#22c55e' : '#f59e0b', fontSize: 12 }}>
          {profile.confirmed ? '已确认，可生成分镜' : '未确认，分镜生成将被门控'}
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
