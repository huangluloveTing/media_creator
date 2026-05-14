import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ShotNode from '../components/nodes/ShotNode';
import { ReactFlowProvider } from '@xyflow/react';

describe('ShotNode', () => {
  const defaultProps: any = {
    id: 'test-shot',
    type: 'shot',
    data: {
      order: 1,
      promptPreview: 'A mountain cabin at sunrise',
      status: 'draft',
      progress: 0,
    },
    selected: false,
    position: { x: 100, y: 100 },
  };

  it('displays draft status with film icon', () => {
    render(
      <ReactFlowProvider>
        <ShotNode {...defaultProps} />
      </ReactFlowProvider>,
    );
    expect(screen.getByText('#1')).toBeDefined();
    expect(screen.getByText('A mountain cabin at sunrise')).toBeDefined();
  });

  it('displays progress bar when generating', () => {
    render(
      <ReactFlowProvider>
        <ShotNode
          {...defaultProps}
          data={{ ...defaultProps.data, status: 'generating', progress: 67 }}
        />
      </ReactFlowProvider>,
    );
    expect(screen.getByText('A mountain cabin at sunrise')).toBeDefined();
    expect(document.querySelector('div[style*="width: 67%"]')).toBeTruthy();
  });

  it('displays error on failure', () => {
    render(
      <ReactFlowProvider>
        <ShotNode
          {...defaultProps}
          data={{
            ...defaultProps.data,
            status: 'failed',
            errorPreview: 'API timeout',
          }}
        />
      </ReactFlowProvider>,
    );
    expect(screen.getByText('API timeout')).toBeDefined();
  });
});
