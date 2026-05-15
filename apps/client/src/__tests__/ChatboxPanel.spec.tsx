import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ChatboxPanel from '../components/ChatboxPanel';
import { ProjectProvider } from '../context/ProjectContext';

describe('ChatboxPanel', () => {
  it('renders chat header, input, and action buttons', () => {
    render(
      <ProjectProvider>
        <ChatboxPanel />
      </ProjectProvider>,
    );

    expect(screen.getByText('Chatbox')).toBeDefined();
    expect(screen.getByText('发送并迭代')).toBeDefined();
    expect(screen.getByText('应用到工程')).toBeDefined();
    expect(screen.getByText('快速')).toBeDefined();
    expect(screen.getByPlaceholderText('描述你想要生成的视频...')).toBeDefined();
  });
});
