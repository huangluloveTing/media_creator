import { useState } from 'react';
import { Button, Input, Typography, Tabs, message } from 'antd';
import { UserOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useProject } from '../../context/ProjectContext';
import { api } from '../../api/client';
import type { PrepNode, CharacterData, CharacterProfile } from '../../types';

const { Text, Title } = Typography;

function parseLines(value: string): string[] {
  return value
    .split(/\n|,|，/)
    .map((x) => x.trim())
    .filter(Boolean);
}

function emptyCharacter(): CharacterProfile {
  return { name: '', appearance: [], outfit: [], traits: [], immutable: [] };
}

function buildCharacterSummary(characters: CharacterProfile[]): string {
  const names = characters.map((c) => c.name || '未命名').join('、');
  const first = characters[0];
  const parts: string[] = [names];
  if (first?.appearance?.length) parts.push(`外观:${first.appearance[0]}`);
  if (first?.outfit?.length) parts.push(`服饰:${first.outfit[0]}`);
  return parts.join(' / ') || '未配置角色形象';
}

export default function CharacterProperties() {
  const { state, dispatch } = useProject();
  const project = state.project;
  if (!project) return null;

  const prepNodes: PrepNode[] = (project as any).prepNodes ?? [];
  const nodeIndex = prepNodes.findIndex((pn) => pn.type === 'character');
  const node = nodeIndex >= 0 ? prepNodes[nodeIndex] : null;
  const data: CharacterData = (node?.data as CharacterData) ?? { characters: [] };
  const characters = data.characters?.length ? data.characters : [emptyCharacter()];
  const [activeCharIndex, setActiveCharIndex] = useState(0);

  const updateData = async (nextData: CharacterData) => {
    const nextNode: PrepNode = {
      id: `prep-character-${node?.order ?? prepNodes.length}`,
      type: 'character',
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

  const updateCharacter = (index: number, patch: Partial<CharacterProfile>) => {
    const next = characters.map((c, i) => (i === index ? { ...c, ...patch } : c));
    updateData({ characters: next });
  };

  const addCharacter = () => {
    updateData({ characters: [...characters, emptyCharacter()] });
    setActiveCharIndex(characters.length);
    message.success('已添加新角色');
  };

  const removeCharacter = (index: number) => {
    if (characters.length <= 1) {
      message.warning('至少保留一个角色');
      return;
    }
    updateData({ characters: characters.filter((_, i) => i !== index) });
    if (activeCharIndex >= characters.length - 1) {
      setActiveCharIndex(Math.max(0, characters.length - 2));
    }
  };

  const confirm = () => {
    if (!node) return;
    const confirmedNode = { ...node, status: 'confirmed' as const };
    const nextNodes = prepNodes.map((pn) => (pn.type === 'character' ? confirmedNode : pn));
    api.updateProject(project.id, { prepNodes: nextNodes as any } as any).then((updated) => {
      dispatch({ type: 'UPDATE_PROJECT', payload: updated as any });
    });
  };

  const char = characters[activeCharIndex] ?? emptyCharacter();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <UserOutlined style={{ color: '#22c55e' }} />
          <Title level={5} style={{ margin: 0, color: '#e2e8f0' }}>
            人物形象
          </Title>
        </div>
        <Button size="small" icon={<PlusOutlined />} onClick={addCharacter}>
          添加角色
        </Button>
      </div>

      {characters.length > 1 && (
        <Tabs
          activeKey={String(activeCharIndex)}
          onChange={(key) => setActiveCharIndex(Number(key))}
          type="card"
          size="small"
          items={characters.map((c, i) => ({
            key: String(i),
            label: c.name || `角色${i + 1}`,
            closeIcon: <DeleteOutlined onClick={() => removeCharacter(i)} />,
          }))}
        />
      )}

      <Label text="角色名">
        <Input
          value={char.name}
          onChange={(e) => updateCharacter(activeCharIndex, { name: e.target.value })}
          style={inputStyle}
        />
      </Label>
      <Label text="外观关键词（逗号/换行分隔）">
        <Input.TextArea
          value={(char.appearance ?? []).join('\n')}
          onChange={(e) =>
            updateCharacter(activeCharIndex, { appearance: parseLines(e.target.value) })
          }
          rows={3}
          style={inputStyle}
        />
      </Label>
      <Label text="服饰关键词（逗号/换行分隔）">
        <Input.TextArea
          value={(char.outfit ?? []).join('\n')}
          onChange={(e) => updateCharacter(activeCharIndex, { outfit: parseLines(e.target.value) })}
          rows={3}
          style={inputStyle}
        />
      </Label>
      <Label text="性格 / 特征（逗号/换行分隔）">
        <Input.TextArea
          value={(char.traits ?? []).join('\n')}
          onChange={(e) => updateCharacter(activeCharIndex, { traits: parseLines(e.target.value) })}
          rows={2}
          style={inputStyle}
        />
      </Label>
      <Label text="固定特征 / 禁改项（逗号/换行分隔）">
        <Input.TextArea
          value={(char.immutable ?? []).join('\n')}
          onChange={(e) =>
            updateCharacter(activeCharIndex, { immutable: parseLines(e.target.value) })
          }
          rows={2}
          style={inputStyle}
        />
      </Label>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Button type="primary" onClick={confirm} disabled={!node}>
          确认形象
        </Button>
        <Text style={{ color: node?.status === 'confirmed' ? '#22c55e' : '#f59e0b', fontSize: 12 }}>
          {node?.status === 'confirmed' ? '已确认，可生成分镜' : '未确认，分镜生成将被门控'}
        </Text>
      </div>

      {characters.length > 0 && (
        <div style={{ borderTop: '1px solid #1e1e4a', paddingTop: 10 }}>
          <Text style={{ color: '#64748b', fontSize: 11 }}>角色列表摘要</Text>
          <pre
            style={{ color: '#cbd5e1', fontSize: 11, whiteSpace: 'pre-wrap', margin: '4px 0 0' }}
          >
            {buildCharacterSummary(characters)}
          </pre>
        </div>
      )}
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
