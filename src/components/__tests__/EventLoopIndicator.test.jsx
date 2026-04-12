import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import EventLoopIndicator from '../Visualizer/EventLoopIndicator';
import useExecutionStore from '../../store/useExecutionStore';

beforeEach(() => {
  useExecutionStore.getState().resetExecution();
});

describe('EventLoopIndicator', () => {
  it('renders event loop labels', () => {
    render(<EventLoopIndicator />);
    expect(screen.getByText('Queue')).toBeInTheDocument();
    expect(screen.getByText('Stack')).toBeInTheDocument();
  });

  it('renders "Event" and "Loop" text', () => {
    render(<EventLoopIndicator />);
    const el = screen.getByText((content) => content.includes('Event'));
    expect(el).toBeInTheDocument();
  });

  it('applies idle class when not active', () => {
    const { container } = render(<EventLoopIndicator />);
    const svg = container.querySelector('svg.event-loop-idle');
    expect(svg).toBeTruthy();
  });

  it('applies active class when event loop is active', () => {
    useExecutionStore.getState().setEventLoopActive(true);
    const { container } = render(<EventLoopIndicator />);
    const svg = container.querySelector('svg.event-loop-active');
    expect(svg).toBeTruthy();
  });
});
