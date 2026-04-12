import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import CallStack from '../Visualizer/CallStack';
import useExecutionStore from '../../store/useExecutionStore';

beforeEach(() => {
  useExecutionStore.getState().resetExecution();
});

describe('CallStack', () => {
  it('renders "Call Stack" header', () => {
    render(<CallStack />);
    expect(screen.getByText('Call Stack')).toBeInTheDocument();
  });

  it('shows idle placeholder when stack is empty', () => {
    render(<CallStack />);
    expect(screen.getByText('Global Execution Context')).toBeInTheDocument();
    expect(screen.getByText('idle')).toBeInTheDocument();
  });

  it('renders stack frames when present', () => {
    useExecutionStore.getState().pushCallStack({ id: 1, name: 'main()', line: 1 });
    render(<CallStack />);
    expect(screen.getByText('main()')).toBeInTheDocument();
    expect(screen.getByText('line 1')).toBeInTheDocument();
  });

  it('renders multiple frames in reverse order (top of stack first)', () => {
    const store = useExecutionStore.getState();
    store.pushCallStack({ id: 1, name: 'Global Execution Context', line: 0 });
    store.pushCallStack({ id: 2, name: 'foo()', line: 5 });
    store.pushCallStack({ id: 3, name: 'bar()', line: 10 });
    render(<CallStack />);
    const frameTexts = screen.getAllByText(/\(\)$|Global Execution Context/);
    expect(frameTexts[0].textContent).toBe('bar()');
  });

  it('shows count badge when frames exist', () => {
    const store = useExecutionStore.getState();
    store.pushCallStack({ id: 1, name: 'a()' });
    store.pushCallStack({ id: 2, name: 'b()' });
    render(<CallStack />);
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('does not show idle placeholder when Global Execution Context is present', () => {
    useExecutionStore.getState().pushCallStack({ id: 1, name: 'Global Execution Context', line: 1 });
    render(<CallStack />);
    expect(screen.queryByText('idle')).not.toBeInTheDocument();
  });

  it('does not show line number for line 0', () => {
    useExecutionStore.getState().pushCallStack({ id: 1, name: 'test()', line: 0 });
    render(<CallStack />);
    expect(screen.queryByText('line 0')).not.toBeInTheDocument();
  });
});
