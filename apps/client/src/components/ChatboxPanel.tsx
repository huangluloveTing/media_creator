import { useMemo, useState } from 'react';
import { Button, Input, Typography, message, Modal, List, Tag } from 'antd';
import {
  MessageOutlined,
  SendOutlined,
  CheckOutlined,
  SyncOutlined,
  ThunderboltOutlined,
  ExperimentOutlined,
} from '@ant-design/icons';
import { useProject } from '../context/ProjectContext';
import { api } from '../api/client';
import type { PrepNode, CharacterData, WorldSettingData, StoryOutlineData } from '../types';
import { migrateCharacterProfileToPrepNodes } from '@media-creator/shared';

const { Text } = Typography;
const { TextArea } = Input;

type StoryboardShot = { order: number; duration: number };
type StoryboardDraft = {
  id: string;
  version: number;
  summary?: string;
  diff?: { lines?: string[] };
  storyboard?: { shots?: StoryboardShot[] };
  characterProfile?: Record<string, unknown>;
};
type DraftApiRow = {
  id: string;
  version: number;
  summary?: string;
  diff?: { lines?: string[] };
  storyboard?: unknown;
};
type ChatMessage = { role: 'user' | 'assistant' | 'system'; content: string };

const CHATBOX_WIDTH = 420;

function resolvePrepNodes(project: any): PrepNode[] {
  const raw = project?.prepNodes;
  if (raw && Array.isArray(raw) && raw.length > 0) return raw as PrepNode[];
  return migrateCharacterProfileToPrepNodes(project?.characterProfileJson ?? null);
}

function syncPrepNodesFromCharacterProfile(
  prepNodes: PrepNode[],
  characterProfile: Record<string, unknown> | undefined,
): PrepNode[] {
  if (!characterProfile) return prepNodes;
  const updated = [...prepNodes];

  const characters = (characterProfile as any).characterProfiles as any[] | undefined;
  if (characters?.length) {
    const charIndex = updated.findIndex((pn) => pn.type === 'character');
    const node: PrepNode = {
      id: 'prep-character-0',
      type: 'character',
      status: 'confirmed',
      order: 0,
      data: { characters } as CharacterData,
    };
    if (charIndex >= 0) updated[charIndex] = node;
    else updated.push(node);
  }

  const worldSetting = (characterProfile as any).worldSetting;
  if (worldSetting && Object.keys(worldSetting).filter((k) => worldSetting[k]).length > 0) {
    const wsIndex = updated.findIndex((pn) => pn.type === 'world_setting');
    const node: PrepNode = {
      id: 'prep-world_setting-1',
      type: 'world_setting',
      status: 'confirmed',
      order: 1,
      data: worldSetting as WorldSettingData,
    };
    if (wsIndex >= 0) updated[wsIndex] = node;
    else updated.push(node);
  }

  const storyOutline = (characterProfile as any).storyOutline;
  if (storyOutline && Object.keys(storyOutline).filter((k) => storyOutline[k]).length > 0) {
    const soIndex = updated.findIndex((pn) => pn.type === 'story_outline');
    const node: PrepNode = {
      id: 'prep-story_outline-2',
      type: 'story_outline',
      status: 'confirmed',
      order: 2,
      data: storyOutline as StoryOutlineData,
    };
    if (soIndex >= 0) updated[soIndex] = node;
    else updated.push(node);
  }

  return updated;
}

export default function ChatboxPanel() {
  const { state, dispatch } = useProject();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [drafting, setDrafting] = useState(false);
  const [applying, setApplying] = useState(false);
  const [drafts, setDrafts] = useState<StoryboardDraft[]>([]);
  const [activeDraft, setActiveDraft] = useState<StoryboardDraft | null>(null);
  const [mode, setMode] = useState<'fast' | 'detailed'>('fast');

  const prepNodes = useMemo(
    () => (state.project ? resolvePrepNodes(state.project) : []),
    [state.project],
  );

  const refreshDrafts = async (projectId: string) => {
    const rows = await api.getStoryboardDrafts(projectId);
    const mapped: StoryboardDraft[] = (rows as DraftApiRow[]).map((r) => ({
      id: r.id,
      version: r.version,
      summary: r.summary,
      diff: r.diff,
      storyboard: (r.storyboard as { shots?: StoryboardShot[] }) ?? { shots: [] },
      characterProfile: (r as any).characterProfile ?? undefined,
    }));
    setDrafts(mapped);
    setActiveDraft(mapped[0] ?? null);
  };

  const onSend = async () => {
    if (!state.project || !input.trim()) return;

    const instruction = input.trim();
    setMessages((prev) => [...prev, { role: 'user', content: instruction }]);
    setInput('');
    setDrafting(true);

    try {
      let loadingIndex = -1;
      let tokenBuffer = '';
      setMessages((prev) => {
        loadingIndex = prev.length;
        return [...prev, { role: 'assistant', content: '正在生成分镜...' }];
      });

      await api.draftStoryboardStream(
        {
          projectId: state.project.id,
          instruction,
          baseDraft: (activeDraft?.storyboard as any) ?? undefined,
          mode,
        },
        {
          onToken: ({ chunk }) => {
            tokenBuffer += chunk;
            setMessages((prev) =>
              prev.map((m, i) => (i === loadingIndex ? { ...m, content: tokenBuffer } : m)),
            );
          },
          onDone: async (result) => {
            const summary = [`已生成 v${result.version}`, result.summary, ...(result.diff ?? [])]
              .filter(Boolean)
              .join('\n');
            setMessages((prev) =>
              prev.map((m, i) => (i === loadingIndex ? { ...m, content: summary } : m)),
            );

            if (result.characterProfile) {
              const synced = syncPrepNodesFromCharacterProfile(
                prepNodes,
                result.characterProfile as Record<string, unknown>,
              );
              if (
                synced.length > prepNodes.length ||
                synced.some((pn, i) => pn.status !== prepNodes[i]?.status)
              ) {
                const updated = await api.updateProject(state.project!.id, {
                  prepNodes: synced as any,
                } as any);
                dispatch({ type: 'UPDATE_PROJECT', payload: updated as any });
              }
            }
            await refreshDrafts(state.project!.id);
          },
          onError: (msg) => {
            setMessages((prev) =>
              prev.map((m, i) => (i === loadingIndex ? { ...m, content: `失败：${msg}` } : m)),
            );
            message.error(msg);
          },
        },
      );
    } catch (err: any) {
      message.error(err.message);
      setMessages((prev) => [...prev, { role: 'assistant', content: `失败：${err.message}` }]);
    } finally {
      setDrafting(false);
    }
  };

  const onApply = async () => {
    if (!state.project || !activeDraft) return;
    Modal.confirm({
      title: '应用草案到工程',
      content: '将覆盖当前全部分镜，是否继续？',
      okText: '确认应用',
      cancelText: '取消',
      onOk: async () => {
        setApplying(true);
        try {
          await api.applyStoryboard(state.project!.id, activeDraft.id, 'replace_all');
          const full = await api.getProjectFull(state.project!.id);
          dispatch({ type: 'SET_PROJECT', payload: full });
          message.success('草案已应用到工程');
          await refreshDrafts(state.project!.id);
        } catch (err: any) {
          message.error(err.message);
        } finally {
          setApplying(false);
        }
      },
    });
  };

  return (
    <div
      style={{
        width: `min(${CHATBOX_WIDTH}px, 40vw)`,
        minWidth: 320,
        display: 'flex',
        flexDirection: 'column',
        padding: '12px 14px',
        gap: 8,
        background: '#0d0d2b',
        borderRight: '1px solid #1e1e4a',
        flexShrink: 0,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <MessageOutlined style={{ color: '#7dd3fc' }} />
          <Text style={{ color: '#e2e8f0', fontWeight: 600, fontSize: 13 }}>Chatbox</Text>
        </div>
        {activeDraft && (
          <Tag color="blue" style={{ margin: 0 }}>
            v{activeDraft.version}
          </Tag>
        )}
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflow: 'auto',
          border: '1px solid #1e1e4a',
          borderRadius: 8,
          padding: '8px 10px',
          background: '#0f1026',
        }}
      >
        <List
          dataSource={messages}
          locale={{
            emptyText: (
              <span style={{ color: '#475569', fontSize: 12 }}>
                描述你想要生成的视频，AI 将自动提取角色形象并生成分镜
              </span>
            ),
          }}
          renderItem={(m) => (
            <List.Item style={{ padding: '6px 0', border: 'none' }}>
              <div style={{ width: '100%' }}>
                <Text
                  style={{
                    color:
                      m.role === 'user'
                        ? '#7dd3fc'
                        : m.role === 'assistant'
                          ? '#c4b5fd'
                          : '#fbbf24',
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  {m.role === 'user' ? '你' : m.role === 'assistant' ? 'AI' : ''}
                </Text>
                <pre
                  style={{
                    margin: '2px 0 0',
                    whiteSpace: 'pre-wrap',
                    color: '#e2e8f0',
                    fontSize: 12,
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                  }}
                >
                  {m.content}
                </pre>
              </div>
            </List.Item>
          )}
        />
      </div>

      {/* Input */}
      <TextArea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="描述你想要生成的视频..."
        autoSize={{ minRows: 2, maxRows: 5 }}
        disabled={!state.project || drafting || applying}
        styles={{
          textarea: {
            background: '#131330',
            color: '#e2e8f0',
            borderColor: '#1e1e4a',
            fontSize: 13,
          },
        }}
      />

      {/* Actions */}
      <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' }}>
        {/* Mode toggle */}
        <Button
          size="small"
          type="text"
          icon={mode === 'fast' ? <ThunderboltOutlined /> : <ExperimentOutlined />}
          onClick={() => setMode((m) => (m === 'fast' ? 'detailed' : 'fast'))}
          style={{ color: mode === 'fast' ? '#fbbf24' : '#a855f7', fontSize: 12, flexShrink: 0 }}
        >
          {mode === 'fast' ? '快速' : '精细'}
        </Button>
        <Button
          type="primary"
          icon={drafting ? <SyncOutlined spin /> : <SendOutlined />}
          loading={drafting}
          onClick={onSend}
          disabled={!input.trim() || !state.project}
          style={{ flex: 1 }}
        >
          发送并迭代
        </Button>
        <Button
          icon={<CheckOutlined />}
          loading={applying}
          onClick={onApply}
          disabled={!activeDraft || !state.project}
          style={{ flex: 1 }}
        >
          应用到工程
        </Button>
      </div>

      {/* Version pills */}
      {drafts.length > 1 && (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', flexShrink: 0 }}>
          {drafts.map((d) => (
            <Button
              key={d.id}
              size="small"
              onClick={() => setActiveDraft(d)}
              type={activeDraft?.id === d.id ? 'primary' : 'default'}
              style={{ padding: '0 8px', fontSize: 11, height: 24 }}
            >
              v{d.version}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
