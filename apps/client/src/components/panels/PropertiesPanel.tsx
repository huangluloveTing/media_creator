import { Typography } from 'antd';
import { AimOutlined } from '@ant-design/icons';
import { useProject } from '../../context/ProjectContext';
import StartProperties from './StartProperties';
import ShotProperties from './ShotProperties';
import EdgeProperties from './EdgeProperties';
import MergeProperties from './MergeProperties';
import CharacterProperties from './CharacterProperties';

const { Text } = Typography;

export default function PropertiesPanel() {
  const { state } = useProject();
  const { selectedElementId, selectedElementType, project } = state;

  if (!selectedElementId || !project) {
    return (
      <div
        style={{
          width: 340,
          background: '#0d0d2b',
          borderLeft: '1px solid #1e1e4a',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          flexShrink: 0,
          padding: 24,
        }}
      >
        <AimOutlined style={{ fontSize: 32, color: '#1e1e4a' }} />
        <Text style={{ color: '#475569', fontSize: 13, textAlign: 'center' }}>
          点击节点或连线编辑属性
        </Text>
      </div>
    );
  }

  const renderContent = () => {
    switch (selectedElementType) {
      case 'start':
        return <StartProperties />;
      case 'merge':
        return <MergeProperties />;
      case 'character':
        return <CharacterProperties />;
      case 'shot': {
        const shot = project.shots.find((s) => s.id === selectedElementId);
        if (!shot) return null;
        return <ShotProperties shotId={shot.id} />;
      }
      case 'edge': {
        const edge = project.edges.find((e) => e.id === selectedElementId);
        if (!edge) return null;
        return <EdgeProperties edgeId={edge.id} />;
      }
      default:
        return null;
    }
  };

  return (
    <div
      style={{
        width: 340,
        background: '#0d0d2b',
        borderLeft: '1px solid #1e1e4a',
        overflow: 'hidden auto',
        flexShrink: 0,
      }}
    >
      <div style={{ padding: 20 }}>{renderContent()}</div>
    </div>
  );
}
