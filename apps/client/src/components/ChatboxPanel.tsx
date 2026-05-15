import { useMemo, useState } from 'react';
import { Button, Input, Typography, message, Modal, List, Tag, Segmented, Select } from 'antd';
import { MessageOutlined, SendOutlined, CheckOutlined, SyncOutlined } from '@ant-design/icons';
import { useProject } from '../context/ProjectContext';
import { api } from '../api/client';
import type { PrepNode, CharacterData, WorldSettingData, StoryOutlineData } from '../types';
import { migrateCharacterProfileToPrepNodes } from '@media-creator/shared';

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

function resolvePrepNodes(project: any): PrepNode[] {
  const raw = project?.prepNodes;
  if (raw && Array.isArray(raw) && raw.length > 0) {
    return raw as PrepNode[];
  }
  return migrateCharacterProfileToPrepNodes(project?.characterProfileJson ?? null);
}

function buildPrepConstraintSummary(prepNodes: PrepNode[]): Record<string, unknown> {
  const summary: Record<string, unknown> = {};
  for (const pn of prepNodes) {
    if (pn.status !== 'confirmed') continue;
    switch (pn.type) {
      case 'character': {
        const data = pn.data as CharacterData;
        summary.characters = (data.characters ?? []).map((c) => ({
          name: c.name,
          appearance: c.appearance,
          outfit: c.outfit,
        }));
        break;
      }
      case 'world_setting': {
        const data = pn.data as WorldSettingData;
        summary.worldSetting = {
          era: data.era,
          location: data.location,
          atmosphere: data.atmosphere,
        };
        break;
      }
      case 'story_outline': {
        const data = pn.data as StoryOutlineData;
        summary.storyOutline = { premise: data.premise, tone: data.tone };
        break;
      }
    }
  }
  return summary;
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
  const [workflowStage, setWorkflowStage] = useState<
    'prep_drafting' | 'prep_confirmed' | 'storyboard_drafting' | 'storyboard_refining'
  >('prep_drafting');
  const [currentPrepNodeId, setCurrentPrepNodeId] = useState<string>('prep-character-0');
  const [constraintSummary, setConstraintSummary] = useState<Record<string, unknown>>({});

  const prepNodes = useMemo(
    () => (state.project ? resolvePrepNodes(state.project) : []),
    [state.project],
  );

  const allPrepConfirmed = useMemo(
    () => prepNodes.length > 0 && prepNodes.every((pn) => pn.status === 'confirmed'),
    [prepNodes],
  );

  const currentPrepNode = useMemo(
    () =>
      prepNodes.find((pn) => `prep-${pn.type}-${pn.order}` === currentPrepNodeId) ??
      prepNodes[0] ??
      null,
    [prepNodes, currentPrepNodeId],
  );

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
    const summary = buildPrepConstraintSummary(prepNodes);
    setConstraintSummary(summary);
    setWorkflowStage(allPrepConfirmed ? 'prep_confirmed' : 'prep_drafting');
  };

  const switchPrepNode = (nodeId: string) => {
    setCurrentPrepNodeId(nodeId);
    const target = prepNodes.find((pn) => `prep-${pn.type}-${pn.order}` === nodeId);
    if (target) {
      setMessages((prev) => [
        ...prev,
        { role: 'system', content: `已切换到「${prepLabel(target.type)}」节点` },
      ]);
    }
  };

  const ensurePrepNodeExists = async () => {
    if (!state.project) return;
    const currentType = currentPrepNode?.type ?? 'character';
    const exists = prepNodes.some((pn) => pn.type === currentType);
    if (exists) return;

    // Auto-create a drafting prep node of the current type
    const newOrder = prepNodes.length;
    const newNode: PrepNode = {
      id: `prep-${currentType}-${newOrder}`,
      type: currentType as PrepNode['type'],
      status: 'drafting',
      order: newOrder,
      data: currentType === 'character'
        ? { characters: [{ name: '', appearance: [], outfit: [], traits: [], immutable: [] }] }
        : currentType === 'world_setting'
          ? { era: '', location: '', atmosphere: [], rules: [], visualStyle: '' }
          : { premise: '', plotBeats: [], tone: '', targetShotCount: 5 },
    } as PrepNode['data'];
    const nextNodes = [...prepNodes, newNode];
    const updated = await api.updateProject(state.project.id, { prepNodes: nextNodes as any } as any);
    dispatch({ type: 'UPDATE_PROJECT', payload: updated as any });
  };

  const runPrepConversation = async (instruction: string) => {
    if (!state.project) return;
    await ensurePrepNodeExists();

    const currentType = currentPrepNode?.type ?? 'character';
    const currentData = currentPrepNode?.data;
    setDrafting(true);

    let loadingIndex = -1;
    let tokenBuffer = '';
    setMessages((prev) => {
      loadingIndex = prev.length;
      return [...prev, { role: 'assistant', content: '...' }];
    });

    try {
      await api.draftPrepStream(
        {
          projectId: state.project.id,
          prepType: currentType,
          instruction,
          currentData: currentData as Record<string, unknown> | undefined,
        },
        {
          onToken: ({ chunk }) => {
            tokenBuffer += chunk;
            setMessages((prev) =>
              prev.map((m, i) =>
                i === loadingIndex ? { ...m, content: tokenBuffer } : m,
              ),
            );
          },
          onPrepExtracted: async ({ prepType, data }) => {
            const label = prepLabel(prepType);
            setMessages((prev) => [
              ...prev,
              { role: 'system', content: `[${label} 提取结果]\n${JSON.stringify(data, null, 2)}` },
            ]);

            // Update the prep node with extracted data
            const nodeIndex = prepNodes.findIndex((pn) => pn.type === prepType);
            const existingNode = nodeIndex >= 0 ? prepNodes[nodeIndex] : null;
            const order = existingNode?.order ?? prepNodes.length;
            const nextNode: PrepNode = {
              id: `prep-${prepType}-${order}`,
              type: prepType as PrepNode['type'],
              status: 'drafting',
              order,
              data: data as PrepNode['data'],
            };
            const nextNodes = nodeIndex >= 0
              ? prepNodes.map((pn, i) => (i === nodeIndex ? nextNode : pn))
              : [...prepNodes, nextNode];
            const updated = await api.updateProject(state.project!.id, { prepNodes: nextNodes as any } as any);
            dispatch({ type: 'UPDATE_PROJECT', payload: updated as any });

            setMessages((prev) => [
              ...prev,
              { role: 'system', content: `「${label}」已更新，如满意请说"确认${label}"，或继续描述修改。` },
            ]);
          },
          onDone: async (result) => {
            if (!result.extracted) {
              // LLM asked questions, just show the response
              setMessages((prev) =>
                prev.map((m, i) => (i === loadingIndex ? { ...m, content: result.text } : m)),
              );
            }
            setWorkflowStage('prep_drafting');
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

  const confirmCurrentPrep = async () => {
    if (!state.project || !currentPrepNode) return;
    const confirmedNode = { ...currentPrepNode, status: 'confirmed' as const };
    const nextNodes = prepNodes.map((pn) =>
      pn.type === currentPrepNode.type ? confirmedNode : pn,
    );
    const updated = await api.updateProject(state.project.id, { prepNodes: nextNodes as any } as any);
    dispatch({ type: 'UPDATE_PROJECT', payload: updated as any });
    setMessages((prev) => [
      ...prev,
      { role: 'system', content: `「${prepLabel(currentPrepNode.type)}」已确认` },
    ]);
    // Check if all prep are now confirmed
    const allConfirmed = nextNodes.every((pn) => pn.status === 'confirmed');
    if (allConfirmed) {
      setWorkflowStage('prep_confirmed');
      setMessages((prev) => [
        ...prev,
        { role: 'system', content: '全部前置准备已完成！现在可以描述你的分镜需求来生成分镜。' },
      ]);
    }
  };

  const onSend = async () => {
    if (!state.project || !input.trim()) return;

    // Check for prep confirmation intent ("确认人物形象", "确认世界观", etc.)
    const confirmIntent = detectPrepConfirmIntent(input.trim());
    if (confirmIntent && currentPrepNode && currentPrepNode.type === confirmIntent) {
      await confirmCurrentPrep();
      setInput('');
      return;
    }

    // Check for natural language prep switching intent
    const switchIntent = detectPrepSwitchIntent(input.trim(), prepNodes);
    if (switchIntent) {
      switchPrepNode(switchIntent);
      setInput('');
      return;
    }

    const instruction = input.trim();
    setMessages((prev) => [...prev, { role: 'user', content: instruction }]);
    setInput('');

    // Route to prep conversation if not all confirmed
    if (!allPrepConfirmed) {
      await runPrepConversation(instruction);
      return;
    }

    // Storyboard generation path
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
            setWorkflowStage('prep_drafting');
          },
          onCharacterSummary: ({ characterProfile }) => {
            setMessages((prev) => [...prev, { role: 'system', content: '人物形象摘要已同步' }]);
          },
          onConstraintSummary: ({ characterProfile }) => {
            setMessages((prev) => [...prev, { role: 'system', content: '已更新约束摘要' }]);
          },
          onPrepExtracted: ({ prepType, data }) => {
            const label = prepLabel(prepType);
            setMessages((prev) => [
              ...prev,
              { role: 'system', content: `[${label} 提取结果]\n${JSON.stringify(data, null, 2)}` },
            ]);
          },
          onPrepSwitched: ({ prepType }) => {
            const label = prepLabel(prepType);
            setMessages((prev) => [
              ...prev,
              { role: 'system', content: `已切换到「${label}」节点` },
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
      setWorkflowStage('prep_drafting');
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

      {/* Prep node selector */}
      {prepNodes.length > 0 && (
        <Select
          value={currentPrepNodeId}
          onChange={switchPrepNode}
          style={{ width: '100%' }}
          options={prepNodes.map((pn) => {
            const id = `prep-${pn.type}-${pn.order}`;
            return {
              value: id,
              label: `${prepLabel(pn.type)} ${pn.status === 'confirmed' ? '✅' : '⏳'}`,
            };
          })}
        />
      )}

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
        {workflowStage === 'prep_drafting'
          ? '前置准备中'
          : workflowStage === 'prep_confirmed'
            ? '前置准备已确认'
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
        <Text style={{ color: '#94a3b8', fontSize: 12 }}>Prep 约束摘要</Text>
        <pre
          style={{
            margin: '6px 0 0',
            color: '#cbd5e1',
            fontSize: 11,
            whiteSpace: 'pre-wrap',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          }}
        >
          {Object.keys(constraintSummary).length > 0
            ? JSON.stringify(constraintSummary, null, 2)
            : '尚未建立 prep 约束'}
        </pre>
        <div style={{ marginTop: 8 }}>
          {prepNodes.map((pn) => (
            <Tag
              key={`prep-${pn.type}-${pn.order}`}
              color={pn.status === 'confirmed' ? 'green' : 'orange'}
            >
              {prepLabel(pn.type)}: {pn.status === 'confirmed' ? '已确认' : '待确认'}
            </Tag>
          ))}
        </div>
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
          locale={{ emptyText: <span style={{ color: '#64748b' }}>开始描述你的创作想法</span> }}
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
        placeholder="描述你的创作想法（人物形象、世界观、故事等）"
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

function prepLabel(type: string): string {
  switch (type) {
    case 'character':
      return '人物形象';
    case 'world_setting':
      return '世界观设定';
    case 'story_outline':
      return '故事梗概';
    default:
      return type;
  }
}

function detectPrepConfirmIntent(text: string): string | null {
  const lower = text.trim().toLowerCase();
  if (/^(确认|可以了|好了|ok|yes|完成|满意)/.test(lower)) {
    if (/人物|角色|形象/.test(lower)) return 'character';
    if (/世界观|世界|设定|背景/.test(lower)) return 'world_setting';
    if (/故事|梗概|剧情|大纲/.test(lower)) return 'story_outline';
    // generic confirmation — infer from context
    return 'character'; // default to character when no specific type mentioned
  }
  return null;
}

function detectPrepSwitchIntent(text: string, prepNodes: PrepNode[]): string | null {
  const lower = text.toLowerCase();
  const patterns: { regex: RegExp; type: string }[] = [
    { regex: /切换(到|至)?\s*(人物|角色|形象)/, type: 'character' },
    { regex: /切换(到|至)?\s*(世界观|世界|设定|背景)/, type: 'world_setting' },
    { regex: /切换(到|至)?\s*(故事|梗概|剧情|大纲)/, type: 'story_outline' },
    { regex: /(我来)?\s*(描述|设定|定义)\s*(世界观|世界|背景)/, type: 'world_setting' },
    { regex: /(我来)?\s*(描述|设定|定义)\s*(故事|剧情|梗概)/, type: 'story_outline' },
  ];
  for (const { regex, type } of patterns) {
    if (regex.test(lower)) {
      const target = prepNodes.find((pn) => pn.type === type);
      if (target) return `prep-${target.type}-${target.order}`;
    }
  }
  return null;
}
