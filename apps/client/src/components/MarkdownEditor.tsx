import { useId } from 'react';
import MDEditor from '@uiw/react-md-editor';

interface MarkdownEditorProps {
  value: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  minHeight?: number;
  disabled?: boolean;
  placeholder?: string;
  showToolbar?: boolean;
}

export default function MarkdownEditor({
  value,
  onChange,
  onBlur,
  minHeight = 200,
  disabled = false,
  placeholder,
  showToolbar = false,
}: MarkdownEditorProps) {
  const height = minHeight < 100 ? 100 : minHeight;
  const instanceId = useId();

  return (
    <div data-color-mode="dark" style={{ width: '100%' }} data-md-instance={instanceId}>
      <MDEditor
        value={value}
        onChange={(v) => onChange?.(v ?? '')}
        onBlur={onBlur}
        height={height}
        preview="edit"
        visibleDragbar={false}
        textareaProps={{
          disabled,
          placeholder,
        }}
        style={{
          background: '#0a0a1a',
          border: '1px solid #1e1e4a',
          borderRadius: 8,
        }}
      />
      {!showToolbar && (
        <style>{`[data-md-instance="${instanceId}"] .w-md-editor-toolbar { display: none !important; }`}</style>
      )}
    </div>
  );
}
