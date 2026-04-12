import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import OutputConsole from '../Intel/OutputConsole';
import useExecutionStore from '../../store/useExecutionStore';

beforeEach(() => {
  useExecutionStore.getState().resetExecution();
});

describe('OutputConsole', () => {
  it('renders "Console" header', () => {
    render(<OutputConsole />);
    expect(screen.getByText('Console')).toBeInTheDocument();
  });

  it('shows placeholder when empty', () => {
    render(<OutputConsole />);
    expect(screen.getByText('Console output appears here')).toBeInTheDocument();
  });

  it('renders log entries', () => {
    useExecutionStore.getState().addConsoleOutput({
      id: 1,
      level: 'log',
      text: 'Hello World',
      timestamp: Date.now(),
    });
    render(<OutputConsole />);
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('renders warn entries', () => {
    useExecutionStore.getState().addConsoleOutput({
      id: 1,
      level: 'warn',
      text: 'Warning message',
      timestamp: Date.now(),
    });
    render(<OutputConsole />);
    expect(screen.getByText('Warning message')).toBeInTheDocument();
  });

  it('renders error entries', () => {
    useExecutionStore.getState().addConsoleOutput({
      id: 1,
      level: 'error',
      text: 'Error occurred',
      timestamp: Date.now(),
    });
    render(<OutputConsole />);
    expect(screen.getByText('Error occurred')).toBeInTheDocument();
  });

  it('renders multiple entries in order', () => {
    const store = useExecutionStore.getState();
    store.addConsoleOutput({ id: 1, level: 'log', text: 'first', timestamp: 1000 });
    store.addConsoleOutput({ id: 2, level: 'log', text: 'second', timestamp: 2000 });
    store.addConsoleOutput({ id: 3, level: 'log', text: 'third', timestamp: 3000 });
    render(<OutputConsole />);
    expect(screen.getByText('first')).toBeInTheDocument();
    expect(screen.getByText('second')).toBeInTheDocument();
    expect(screen.getByText('third')).toBeInTheDocument();
  });

  it('shows Clear button when output exists', () => {
    useExecutionStore.getState().addConsoleOutput({
      id: 1,
      level: 'log',
      text: 'test',
      timestamp: Date.now(),
    });
    render(<OutputConsole />);
    expect(screen.getByText('Clear')).toBeInTheDocument();
  });

  it('does not show Clear button when empty', () => {
    render(<OutputConsole />);
    expect(screen.queryByText('Clear')).not.toBeInTheDocument();
  });

  it('Clear button clears the console', () => {
    useExecutionStore.getState().addConsoleOutput({
      id: 1,
      level: 'log',
      text: 'test',
      timestamp: Date.now(),
    });
    render(<OutputConsole />);
    fireEvent.click(screen.getByText('Clear'));
    expect(useExecutionStore.getState().consoleOutput).toEqual([]);
  });

  it('hides placeholder when entries exist', () => {
    useExecutionStore.getState().addConsoleOutput({
      id: 1,
      level: 'log',
      text: 'data',
      timestamp: Date.now(),
    });
    render(<OutputConsole />);
    expect(screen.queryByText('Console output appears here')).not.toBeInTheDocument();
  });

  it('displays timestamp for each entry', () => {
    const ts = new Date(2024, 0, 1, 14, 30, 45).getTime();
    useExecutionStore.getState().addConsoleOutput({
      id: 1,
      level: 'log',
      text: 'timed entry',
      timestamp: ts,
    });
    render(<OutputConsole />);
    expect(screen.getByText('14:30:45')).toBeInTheDocument();
  });
});
