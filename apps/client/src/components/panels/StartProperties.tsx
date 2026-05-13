import { Input, Select, InputNumber, Typography } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import { useProject } from '../../context/ProjectContext';
import { api } from '../../api/client';

const { Text, Title } = Typography;

const formStyle: React.CSSProperties = {
  width: '100%',
  background: '#131330',
  borderColor: '#1e1e4a',
  color: '#e2e8f0',
};

export default function StartProperties() {
  const { state, dispatch } = useProject();
  const project = state.project;
  if (!project) return null;

  const update = async (field: string, value: string | number) => {
    const updated = await api.updateProject(project.id, { [field]: value });
    dispatch({ type: 'UPDATE_PROJECT', payload: updated });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: 'rgba(52, 211, 153, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <SettingOutlined style={{ color: '#34d399', fontSize: 14 }} />
        </div>
        <Title level={5} style={{ margin: 0, color: '#e2e8f0' }}>
          全局设置
        </Title>
      </div>

      <Label text="分辨率">
        <Select
          value={project.resolution}
          onChange={(v) => update('resolution', v)}
          style={formStyle}
          options={[
            { value: '1920x1080', label: '1920x1080 (横屏)' },
            { value: '1280x720', label: '1280x720 (横屏)' },
            { value: '1080x1920', label: '1080x1920 (竖屏)' },
          ]}
        />
      </Label>

      <Label text="帧率 (FPS)">
        <Select
          value={project.fps}
          onChange={(v) => update('fps', v)}
          style={formStyle}
          options={[
            { value: 24, label: '24' },
            { value: 30, label: '30' },
            { value: 60, label: '60' },
          ]}
        />
      </Label>

      <Label text="默认转场">
        <Select
          value={project.defaultTransitionType}
          onChange={(v) => update('defaultTransitionType', v)}
          style={formStyle}
          options={[
            { value: 'cut', label: '硬切' },
            { value: 'dissolve', label: '叠化' },
            { value: 'fade', label: '淡入淡出' },
            { value: 'wipe', label: '擦除' },
          ]}
        />
      </Label>

      <Label text="默认转场时长 (秒)">
        <InputNumber
          value={project.defaultTransitionDuration}
          min={0}
          max={5}
          step={0.1}
          onChange={(v) => update('defaultTransitionDuration', v ?? 0)}
          style={formStyle}
        />
      </Label>

      <Label text="全局风格提示词">
        <Input.TextArea
          value={project.globalStylePrompt}
          placeholder="例如：电影感、4K、胶片颗粒、自然光"
          onChange={(e) => update('globalStylePrompt', e.target.value)}
          rows={3}
          style={{
            ...formStyle,
            background: '#131330',
            borderColor: '#1e1e4a',
          }}
        />
      </Label>

      <Label text="输出目录">
        <Input
          value={project.outputDir}
          placeholder="./output"
          onChange={(e) => update('outputDir', e.target.value)}
          style={formStyle}
        />
      </Label>
    </div>
  );
}

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
