import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ChatboxPanel from '../components/ChatboxPanel';
import { ProjectProvider } from '../context/ProjectContext';

describe('ChatboxPanel', () => {
  it('renders default summary and title', () => {
    render(
      <ProjectProvider>
        <ChatboxPanel />
      </ProjectProvider>,
    );

    expect(screen.getByText('分镜 Chatbox')).toBeDefined();
    expect(screen.getByText('镜头数: 0/5')).toBeDefined();
    expect(screen.getByText('总时长: 0 秒')).toBeDefined();
    expect(screen.getByText('角色一致性约束')).toBeDefined();
    expect(screen.getByText('快速模式')).toBeDefined();
  });
});
