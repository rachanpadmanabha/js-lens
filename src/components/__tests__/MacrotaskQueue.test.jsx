import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import MacrotaskQueue from '../Visualizer/MacrotaskQueue';
import useExecutionStore from '../../store/useExecutionStore';

beforeEach(() => {
  useExecutionStore.getState().resetExecution();
});

describe('MacrotaskQueue', () => {
  it('renders header', () => {
    render(<MacrotaskQueue />);
    expect(screen.getByText('Macrotask Queue')).toBeInTheDocument();
  });

  it('shows "Empty" when queue is empty', () => {
    render(<MacrotaskQueue />);
    expect(screen.getByText('Empty')).toBeInTheDocument();
  });

  it('shows "(timers, I/O)" hint', () => {
    render(<MacrotaskQueue />);
    expect(screen.getByText('(timers, I/O)')).toBeInTheDocument();
  });

  it('renders task names when queue has items', () => {
    useExecutionStore.getState().addMacrotask({
      id: 1,
      name: 'setTimeout callback (0ms)',
      detail: 'Timer done',
    });
    render(<MacrotaskQueue />);
    expect(screen.getByText('setTimeout callback (0ms)')).toBeInTheDocument();
    expect(screen.getByText('Timer done')).toBeInTheDocument();
  });

  it('renders multiple tasks', () => {
    const store = useExecutionStore.getState();
    store.addMacrotask({ id: 1, name: 'timer1' });
    store.addMacrotask({ id: 2, name: 'timer2' });
    render(<MacrotaskQueue />);
    expect(screen.getByText('timer1')).toBeInTheDocument();
    expect(screen.getByText('timer2')).toBeInTheDocument();
  });

  it('shows count badge', () => {
    const store = useExecutionStore.getState();
    store.addMacrotask({ id: 1, name: 'a' });
    store.addMacrotask({ id: 2, name: 'b' });
    store.addMacrotask({ id: 3, name: 'c' });
    render(<MacrotaskQueue />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('hides "Empty" when tasks are present', () => {
    useExecutionStore.getState().addMacrotask({ id: 1, name: 'test' });
    render(<MacrotaskQueue />);
    expect(screen.queryByText('Empty')).not.toBeInTheDocument();
  });
});
