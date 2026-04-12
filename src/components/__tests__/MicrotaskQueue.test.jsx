import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import MicrotaskQueue from '../Visualizer/MicrotaskQueue';
import useExecutionStore from '../../store/useExecutionStore';

beforeEach(() => {
  useExecutionStore.getState().resetExecution();
});

describe('MicrotaskQueue', () => {
  it('renders header', () => {
    render(<MicrotaskQueue />);
    expect(screen.getByText('Microtask Queue')).toBeInTheDocument();
  });

  it('shows "Empty" when queue is empty', () => {
    render(<MicrotaskQueue />);
    expect(screen.getByText('Empty')).toBeInTheDocument();
  });

  it('shows "(runs first)" hint', () => {
    render(<MicrotaskQueue />);
    expect(screen.getByText('(runs first)')).toBeInTheDocument();
  });

  it('renders task names when queue has items', () => {
    useExecutionStore.getState().addMicrotask({ id: 1, name: '.then() callback', detail: 'Promise resolved' });
    render(<MicrotaskQueue />);
    expect(screen.getByText('.then() callback')).toBeInTheDocument();
    expect(screen.getByText('Promise resolved')).toBeInTheDocument();
  });

  it('renders multiple tasks', () => {
    const store = useExecutionStore.getState();
    store.addMicrotask({ id: 1, name: 'micro1' });
    store.addMicrotask({ id: 2, name: 'micro2' });
    store.addMicrotask({ id: 3, name: 'micro3' });
    render(<MicrotaskQueue />);
    expect(screen.getByText('micro1')).toBeInTheDocument();
    expect(screen.getByText('micro2')).toBeInTheDocument();
    expect(screen.getByText('micro3')).toBeInTheDocument();
  });

  it('shows count badge', () => {
    const store = useExecutionStore.getState();
    store.addMicrotask({ id: 1, name: 'a' });
    store.addMicrotask({ id: 2, name: 'b' });
    render(<MicrotaskQueue />);
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('hides "Empty" when tasks are present', () => {
    useExecutionStore.getState().addMicrotask({ id: 1, name: 'test' });
    render(<MicrotaskQueue />);
    expect(screen.queryByText('Empty')).not.toBeInTheDocument();
  });
});
