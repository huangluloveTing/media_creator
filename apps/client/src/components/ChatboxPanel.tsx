import { useMemo, useState } from 'react';
import { Button, Input, Typography, message, Modal, List, Tag, Segmented } from 'antd';
import { MessageOutlined, SendOutlined, CheckOutlined, SyncOutlined } from '@ant-design/icons';
import { useProject } from '../context/ProjectContext';
import { api } from '../api/client';

const { Text } = Typography;
const { TextArea } = Input;

type StoryboardShot = {
  order: number;
  duration: number;
};

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

type ChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

const CHATBOX_WIDTH = 420;

export default function ChatboxPanel() {
  const { state, dispatch } = useProject();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [drafting, setDrafting] = useState(false);
  const [applying, setApplying] = useState(false);
  const [drafts, setDrafts] = useState<StoryboardDraft[]>([]);
  const [activeDraft, setActiveDraft] = useState<StoryboardDraft | null>(null);
  const [mode, setMode] = useState<'fast' | 'detailed'>('fast');
  const [workflowStage, setWorkflowStage] = useState<
    'character_drafting' | 'character_confirmed' | 'storyboard_drafting' | 'storyboard_refining'
  >('character_drafting');
  const [characterSummary, setCharacterSummary] = useState<Record<string, unknown> | null>(null);

  const shotCount = activeDraft?.storyboard?.shots?.length ?? 0;
  const totalDuration = useMemo(
    () => (activeDraft?.storyboard?.shots ?? []).reduce((sum, s) => sum + s.duration, 0),
    [activeDraft],
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
    const current = mapped[0] ?? null;
    setActiveDraft(current);
    const projectProfile = (state.project as any)?.characterProfileJson as Record<string, unknown>;
    const summary =
      projectProfile ?? (current?.characterProfile as Record<string, unknown>) ?? null;
    setCharacterSummary(summary);
    setWorkflowStage((summary as any)?.confirmed ? 'character_confirmed' : 'character_drafting');
  };

  const onSend = async () => {
    if (!state.project || !input.trim()) return;
    const projectProfile = ((state.project as any).characterProfileJson ?? null) as Record<
      string,
      unknown
    > | null;
    if (!projectProfile || !(projectProfile as any).confirmed) {
      message.warning('请先在人物形象节点确认角色形象，再生成分镜。');
      setMessages((prev) => [
        ...prev,
        { role: 'system', content: '请先完成人物形象节点确认，然后再开始分镜生成。' },
      ]);
      setWorkflowStage('character_drafting');
      return;
    }
    const instruction = input.trim();
    setMessages((prev) => [...prev, { role: 'user', content: instruction }]);
    setInput('');
    setDrafting(true);
    try {
      setWorkflowStage('storyboard_drafting');
      let loadingIndex = -1;
      let tokenBuffer = '';
      setMessages((prev) => {
        loadingIndex = prev.length;
        return [...prev, { role: 'assistant', content: '正在准备分镜草案...' }];
      });
      await api.draftStoryboardStream(
        {
          projectId: state.project.id,
          instruction,
          baseDraft: (activeDraft?.storyboard as any) ?? undefined,
          mode,
        },
        {
          onProgress: ({ stage }) => {
            const stageText: Record<string, string> = {
              validating: '校验输入中...',
              generating: 'LLM 生成中...',
              persisting: '保存草案中...',
            };
            if (tokenBuffer && stage === 'generating') return;
            setMessages((prev) => [
              ...prev,
              { role: 'system', content: stageText[stage] ?? `处理中: ${stage}` },
            ]);
          },
          onToken: ({ chunk }) => {
            tokenBuffer += chunk;
            setMessages((prev) =>
              prev.map((m, i) =>
                i === loadingIndex ? { ...m, content: `LLM 输出中...\n${tokenBuffer}` } : m,
              ),
            );
          },
          onClarification: ({ question }) => {
            setMessages((prev) => [...prev, { role: 'system', content: `澄清问题：${question}` }]);
          },
          onCharacterDraft: ({ stage }) => {
            setMessages((prev) => [...prev, { role: 'system', content: `人物形象阶段：${stage}` }]);
          },
          onCharacterConfirmationNeeded: ({ message: msg }) => {
            setMessages((prev) => [...prev, { role: 'system', content: msg }]);
            setWorkflowStage('character_drafting');
          },
          onCharacterSummary: ({ characterProfile }) => {
            setCharacterSummary((characterProfile as Record<string, unknown>) ?? null);
            setMessages((prev) => [...prev, { role: 'system', content: '人物形象摘要已同步' }]);
          },
          onConstraintSummary: ({ characterProfile }) => {
            setCharacterSummary((characterProfile as Record<string, unknown>) ?? null);
            setMessages((prev) => [
              ...prev,
              { role: 'system', content: '已更新角色一致性约束摘要' },
            ]);
          },
          onDone: async (result) => {
            const assistantText = [
              `已生成 v${result.version}`,
              result.summary,
              ...(result.diff ?? []),
            ]
              .filter(Boolean)
              .join('\n');
            setMessages((prev) =>
              prev.map((m, i) => (i === loadingIndex ? { ...m, content: assistantText } : m)),
            );
            setCharacterSummary((result.characterProfile as Record<string, unknown>) ?? null);
            setWorkflowStage('storyboard_refining');
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
      setWorkflowStage('character_drafting');
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
        padding: 14,
        gap: 10,
        background: '#0d0d2b',
        borderRight: '1px solid #1e1e4a',
        flexShrink: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <MessageOutlined style={{ color: '#7dd3fc' }} />
          <Text style={{ color: '#e2e8f0', fontWeight: 600 }}>分镜 Chatbox</Text>
        </div>
        {activeDraft && <Tag color="blue">v{activeDraft.version}</Tag>}
      </div>
      <Segmented<'fast' | 'detailed'>
        value={mode}
        onChange={(v) => setMode(v)}
        options={[
          { label: '快速模式', value: 'fast' },
          { label: '精细模式', value: 'detailed' },
        ]}
      />
      <Text style={{ color: '#94a3b8', fontSize: 12 }}>
        工作流阶段：
        {workflowStage === 'character_drafting'
          ? '人物形象生成'
          : workflowStage === 'character_confirmed'
            ? '人物形象已确认'
            : workflowStage === 'storyboard_drafting'
              ? '分镜生成中'
              : '分镜迭代中'}
      </Text>

      <div
        style={{
          border: '1px solid #1e1e4a',
          borderRadius: 8,
          padding: 10,
          background: '#131330',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        <Text style={{ color: '#94a3b8', fontSize: 12 }}>当前草案摘要</Text>
        <Text style={{ color: '#e2e8f0', fontSize: 12 }}>镜头数: {shotCount}/5</Text>
        <Text style={{ color: '#e2e8f0', fontSize: 12 }}>总时长: {totalDuration} 秒</Text>
      </div>
      <div
        style={{
          border: '1px solid #1e1e4a',
          borderRadius: 8,
          padding: 10,
          background: '#131330',
        }}
      >
        <Text style={{ color: '#94a3b8', fontSize: 12 }}>角色一致性约束</Text>
        <pre
          style={{
            margin: '6px 0 0',
            color: '#cbd5e1',
            fontSize: 11,
            whiteSpace: 'pre-wrap',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          }}
        >
          {characterSummary ? JSON.stringify(characterSummary, null, 2) : '尚未建立角色约束'}
        </pre>
      </div>

      <div
        style={{
          flex: 1,
          minHeight: 160,
          overflow: 'auto',
          border: '1px solid #1e1e4a',
          borderRadius: 8,
          padding: 8,
          background: '#0f1026',
        }}
      >
        <List
          dataSource={messages}
          locale={{ emptyText: <span style={{ color: '#64748b' }}>开始描述你的分镜想法</span> }}
          renderItem={(m) => (
            <List.Item style={{ padding: '8px 0', border: 'none' }}>
              <div style={{ width: '100%' }}>
                <Text
                  style={{
                    color:
                      m.role === 'user'
                        ? '#7dd3fc'
                        : m.role === 'assistant'
                          ? '#c4b5fd'
                          : '#fbbf24',
                    fontSize: 12,
                  }}
                >
                  {m.role === 'user' ? '你' : m.role === 'assistant' ? 'AI' : '系统'}
                </Text>
                <pre
                  style={{
                    margin: '4px 0 0',
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

      <TextArea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="例如：我要一个雨夜追逐感的5镜头分镜"
        autoSize={{ minRows: 3, maxRows: 6 }}
        disabled={!state.project || drafting || applying}
        styles={{ textarea: { background: '#131330', color: '#e2e8f0', borderColor: '#1e1e4a' } }}
      />

      <div style={{ display: 'flex', gap: 8 }}>
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

      {drafts.length > 0 && (
        <div style={{ borderTop: '1px solid #1e1e4a', paddingTop: 8 }}>
          <Text style={{ color: '#94a3b8', fontSize: 12 }}>版本历史</Text>
          <div style={{ marginTop: 6, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {drafts.map((d) => (
              <Button
                key={d.id}
                size="small"
                onClick={() => setActiveDraft(d)}
                type={activeDraft?.id === d.id ? 'primary' : 'default'}
              >
                v{d.version}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
