import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import WebAPIsBox from '../Visualizer/WebAPIsBox';
import useExecutionStore from '../../store/useExecutionStore';

beforeEach(() => {
  useExecutionStore.getState().resetExecution();
});

describe('WebAPIsBox', () => {
  it('renders header', () => {
    render(<WebAPIsBox />);
    expect(screen.getByText('Web APIs')).toBeInTheDocument();
  });

  it('shows "No active Web APIs" when empty', () => {
    render(<WebAPIsBox />);
    expect(screen.getByText('No active Web APIs')).toBeInTheDocument();
  });

  it('renders a setTimeout entry', () => {
    useExecutionStore.getState().addWebAPI({
      id: 1,
      type: 'setTimeout',
      delay: 1000,
      startTime: Date.now(),
    });
    render(<WebAPIsBox />);
    expect(screen.getByText('setTimeout')).toBeInTheDocument();
  });

  it('renders a setInterval entry', () => {
    useExecutionStore.getState().addWebAPI({
      id: 2,
      type: 'setInterval',
      delay: 500,
      startTime: Date.now(),
    });
    render(<WebAPIsBox />);
    expect(screen.getByText('setInterval')).toBeInTheDocument();
  });

  it('renders multiple API entries', () => {
    const store = useExecutionStore.getState();
    store.addWebAPI({ id: 1, type: 'setTimeout', delay: 100, startTime: Date.now() });
    store.addWebAPI({ id: 2, type: 'fetch', delay: 0, startTime: Date.now() });
    render(<WebAPIsBox />);
    expect(screen.getByText('setTimeout')).toBeInTheDocument();
    expect(screen.getByText('fetch')).toBeInTheDocument();
  });

  it('hides empty message when APIs are present', () => {
    useExecutionStore.getState().addWebAPI({
      id: 1,
      type: 'setTimeout',
      delay: 0,
      startTime: Date.now(),
    });
    render(<WebAPIsBox />);
    expect(screen.queryByText('No active Web APIs')).not.toBeInTheDocument();
  });

  it('shows "ready" when delay has elapsed', () => {
    useExecutionStore.getState().addWebAPI({
      id: 1,
      type: 'setTimeout',
      delay: 0,
      startTime: Date.now() - 1000,
    });
    render(<WebAPIsBox />);
    expect(screen.getByText('ready')).toBeInTheDocument();
  });
});
