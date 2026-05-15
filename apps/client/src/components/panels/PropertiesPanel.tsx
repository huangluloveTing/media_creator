import { useEffect, useState } from 'react';
import { Typography, Tag, Descriptions } from 'antd';
import {
  AimOutlined,
  FileTextOutlined,
  UserOutlined,
  GlobalOutlined,
  BookOutlined,
} from '@ant-design/icons';
import { useProject } from '../../context/ProjectContext';
import { api } from '../../api/client';
import type { PrepNode, CharacterData, WorldSettingData, StoryOutlineData } from '../../types';
import StartProperties from './StartProperties';
import ShotProperties from './ShotProperties';
import EdgeProperties from './EdgeProperties';
import MergeProperties from './MergeProperties';
import CharacterProperties from './CharacterProperties';
import WorldSettingProperties from './WorldSettingProperties';
import StoryOutlineProperties from './StoryOutlineProperties';

const { Text, Title } = Typography;

type DraftInfo = { version: number; shotCount: number; totalDuration: number; summary?: string };

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

function buildPrepSummaryText(node: PrepNode): string {
  switch (node.type) {
    case 'character': {
      const data = node.data as CharacterData;
      return (data.characters ?? []).map((c) => c.name || '未命名').join('、') || '未配置';
    }
    case 'world_setting': {
      const data = node.data as WorldSettingData;
      return [data.era, data.location].filter(Boolean).join(' / ') || '未配置';
    }
    case 'story_outline': {
      const data = node.data as StoryOutlineData;
      return data.premise || '未配置';
    }
    default:
      return '未配置';
  }
}

export default function PropertiesPanel() {
  const { state } = useProject();
  const { selectedElementId, selectedElementType, project } = state;
  const [draftInfo, setDraftInfo] = useState<DraftInfo | null>(null);

  useEffect(() => {
    if (!project?.id) return;
    api
      .getStoryboardDrafts(project.id)
      .then((rows: any[]) => {
        if (rows.length === 0) {
          setDraftInfo(null);
          return;
        }
        const latest = rows[0];
        const shots = (latest.storyboard as any)?.shots ?? [];
        setDraftInfo({
          version: latest.version,
          shotCount: shots.length,
          totalDuration: shots.reduce((n: number, s: any) => n + (s.duration ?? 0), 0),
          summary: latest.summary,
        });
      })
      .catch(() => setDraftInfo(null));
  }, [project?.id]);

  const prepNodes: PrepNode[] = (project as any)?.prepNodes ?? [];
  const hasSelection = !!selectedElementId && !!project;

  if (!project) {
    return (
      <div
        style={{
          width: 320,
          background: '#0d0d2b',
          borderLeft: '1px solid #1e1e4a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <AimOutlined style={{ fontSize: 32, color: '#1e1e4a' }} />
      </div>
    );
  }

  if (!hasSelection) {
    return (
      <div
        style={{
          width: 320,
          background: '#0d0d2b',
          borderLeft: '1px solid #1e1e4a',
          overflow: 'hidden auto',
          flexShrink: 0,
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
        }}
      >
        {/* Draft Info */}
        <Section icon={<FileTextOutlined style={{ color: '#7dd3fc' }} />} title="当前草案">
          {draftInfo ? (
            <Descriptions
              size="small"
              column={1}
              colon={false}
              styles={{
                label: { color: '#64748b', fontSize: 11 },
                content: { color: '#e2e8f0', fontSize: 12 },
              }}
            >
              <Descriptions.Item label="版本">v{draftInfo.version}</Descriptions.Item>
              <Descriptions.Item label="镜头数">{draftInfo.shotCount}/5</Descriptions.Item>
              <Descriptions.Item label="总时长">{draftInfo.totalDuration} 秒</Descriptions.Item>
              {draftInfo.summary && (
                <Descriptions.Item label="摘要">
                  <Text style={{ color: '#94a3b8', fontSize: 11 }}>{draftInfo.summary}</Text>
                </Descriptions.Item>
              )}
            </Descriptions>
          ) : (
            <Text style={{ color: '#475569', fontSize: 12 }}>
              暂无草案，在 Chatbox 中描述视频以生成
            </Text>
          )}
        </Section>

        {/* Prep Nodes Status */}
        <Section icon={<UserOutlined style={{ color: '#22c55e' }} />} title="前置准备">
          {prepNodes.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {prepNodes.map((pn) => (
                <div
                  key={`${pn.type}-${pn.order}`}
                  style={{
                    border: '1px solid #1e1e4a',
                    borderRadius: 6,
                    padding: 8,
                    background: '#131330',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 4,
                    }}
                  >
                    <Text style={{ color: '#e2e8f0', fontSize: 12, fontWeight: 600 }}>
                      {pn.type === 'character' ? (
                        <UserOutlined style={{ marginRight: 4 }} />
                      ) : pn.type === 'world_setting' ? (
                        <GlobalOutlined style={{ marginRight: 4 }} />
                      ) : (
                        <BookOutlined style={{ marginRight: 4 }} />
                      )}
                      {prepLabel(pn.type)}
                    </Text>
                    <Tag
                      color={pn.status === 'confirmed' ? 'green' : 'orange'}
                      style={{ margin: 0, fontSize: 10 }}
                    >
                      {pn.status === 'confirmed' ? '已确认' : '待确认'}
                    </Tag>
                  </div>
                  <Text style={{ color: '#94a3b8', fontSize: 11 }}>{buildPrepSummaryText(pn)}</Text>
                </div>
              ))}
            </div>
          ) : (
            <Text style={{ color: '#475569', fontSize: 12 }}>暂无前置准备节点</Text>
          )}
        </Section>

        <Text style={{ color: '#334155', fontSize: 11, textAlign: 'center' }}>
          点击流程图中的节点或连线编辑属性
        </Text>
      </div>
    );
  }

  return (
    <div
      style={{
        width: 320,
        background: '#0d0d2b',
        borderLeft: '1px solid #1e1e4a',
        overflow: 'hidden auto',
        flexShrink: 0,
      }}
    >
      <div style={{ padding: 20 }}>
        {(() => {
          switch (selectedElementType) {
            case 'start':
              return <StartProperties />;
            case 'merge':
              return <MergeProperties />;
            case 'character':
              return <CharacterProperties />;
            case 'world_setting':
              return <WorldSettingProperties />;
            case 'story_outline':
              return <StoryOutlineProperties />;
            case 'shot': {
              const shot = project.shots.find((s) => s.id === selectedElementId);
              return shot ? <ShotProperties shotId={shot.id} /> : null;
            }
            case 'edge': {
              const edge = project.edges.find((e) => e.id === selectedElementId);
              return edge ? <EdgeProperties edgeId={edge.id} /> : null;
            }
            default:
              return null;
          }
        })()}
      </div>
    </div>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        {icon}
        <Text
          style={{
            color: '#94a3b8',
            fontSize: 11,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          {title}
        </Text>
      </div>
      {children}
    </div>
  );
}
