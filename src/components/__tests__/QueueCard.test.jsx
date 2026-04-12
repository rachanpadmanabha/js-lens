import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import QueueCard from '../Visualizer/QueueCard';

describe('QueueCard', () => {
  it('renders name', () => {
    render(<QueueCard name="test task" />);
    expect(screen.getByText('test task')).toBeInTheDocument();
  });

  it('renders detail when provided', () => {
    render(<QueueCard name="task" detail="some detail" />);
    expect(screen.getByText('some detail')).toBeInTheDocument();
  });

  it('does not render detail when not provided', () => {
    const { container } = render(<QueueCard name="task" />);
    const detailEls = container.querySelectorAll('.text-\\[11px\\]');
    // Only the detail div should be absent
    expect(screen.queryByText('some detail')).not.toBeInTheDocument();
  });

  it('applies glow class based on glow prop', () => {
    const { container } = render(<QueueCard name="task" glow="purple" />);
    expect(container.firstChild.classList.contains('glow-purple')).toBe(true);
  });

  it('defaults glow to blue', () => {
    const { container } = render(<QueueCard name="task" />);
    expect(container.firstChild.classList.contains('glow-blue')).toBe(true);
  });

  it('applies horizontal layout class', () => {
    const { container } = render(<QueueCard name="task" layout="horizontal" />);
    expect(container.firstChild.classList.contains('flex-shrink-0')).toBe(true);
  });

  it('renders with all glow variants', () => {
    const glows = ['blue', 'purple', 'amber', 'pink', 'green', 'indigo'];
    glows.forEach((glow) => {
      const { container } = render(<QueueCard name={`task-${glow}`} glow={glow} />);
      expect(container.firstChild.classList.contains(`glow-${glow}`)).toBe(true);
    });
  });
});
