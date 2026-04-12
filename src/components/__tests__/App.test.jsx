import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import useEditorStore, { PRESETS } from '../../store/useEditorStore';
import useExecutionStore from '../../store/useExecutionStore';

// Mock Monaco editor since it requires browser APIs not available in jsdom
vi.mock('@monaco-editor/react', () => ({
  default: ({ value, onChange, onMount }) => (
    <textarea
      data-testid="monaco-editor"
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
    />
  ),
}));

// Mock stepRunner to avoid side effects
vi.mock('../../engine/stepRunner', () => ({
  runAllSteps: vi.fn(),
  resetSteps: vi.fn(),
  prepareSteps: vi.fn(() => []),
  stepForward: vi.fn(),
}));

// Mock react-resizable-panels — provide simple pass-through components
vi.mock('react-resizable-panels', () => ({
  Group: ({ children, ...props }) => <div data-testid="panel-group" {...props}>{children}</div>,
  Panel: ({ children, ...props }) => <div data-testid="panel" {...props}>{children}</div>,
  Separator: (props) => <div data-testid="panel-separator" {...props} />,
}));

const { default: App } = await import('../../App');

beforeEach(() => {
  useEditorStore.setState({
    code: PRESETS['Event Loop Order'],
    preset: 'Event Loop Order',
    stepMode: false,
    currentStep: 0,
    totalSteps: 0,
    isRunning: false,
    speed: 3,
  });
  useExecutionStore.getState().resetExecution();
});

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />);
    expect(screen.getByText('JS Lens')).toBeInTheDocument();
  });

  it('renders all three panel sections', () => {
    render(<App />);
    expect(screen.getByText('Editor')).toBeInTheDocument();
    expect(screen.getByText('Runtime Visualizer')).toBeInTheDocument();
    expect(screen.getByText('Code Intelligence')).toBeInTheDocument();
  });

  it('renders the navbar', () => {
    render(<App />);
    expect(screen.getByText('Run')).toBeInTheDocument();
    expect(screen.getByTitle('Reset')).toBeInTheDocument();
  });

  it('renders the call stack component', () => {
    render(<App />);
    expect(screen.getByText('Call Stack')).toBeInTheDocument();
  });

  it('renders the web APIs component', () => {
    render(<App />);
    expect(screen.getByText('Web APIs')).toBeInTheDocument();
  });

  it('renders the microtask queue component', () => {
    render(<App />);
    expect(screen.getByText('Microtask Queue')).toBeInTheDocument();
  });

  it('renders the macrotask queue component', () => {
    render(<App />);
    expect(screen.getByText('Macrotask Queue')).toBeInTheDocument();
  });

  it('renders the concept detector component', () => {
    render(<App />);
    expect(screen.getByText('Detected Concepts')).toBeInTheDocument();
  });

  it('renders the scope tree component', () => {
    render(<App />);
    expect(screen.getByText('Scope Tree')).toBeInTheDocument();
  });

  it('renders the console component', () => {
    render(<App />);
    expect(screen.getByText('Console')).toBeInTheDocument();
  });

  it('renders panel separators for resizable layout', () => {
    render(<App />);
    const separators = screen.getAllByTestId('panel-separator');
    expect(separators.length).toBe(2);
  });

  it('renders three panels', () => {
    render(<App />);
    const panels = screen.getAllByTestId('panel');
    expect(panels.length).toBe(3);
  });
});
