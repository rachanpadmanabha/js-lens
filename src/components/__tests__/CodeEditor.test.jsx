import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import useEditorStore, { PRESETS } from '../../store/useEditorStore';
import useExecutionStore from '../../store/useExecutionStore';

// Mock Monaco editor
vi.mock('@monaco-editor/react', () => ({
  default: ({ value, onChange, onMount, ...rest }) => (
    <textarea
      data-testid="monaco-editor"
      value={value || ''}
      onChange={(e) => onChange?.(e.target.value)}
      readOnly={false}
    />
  ),
}));

// Mock stepRunner
vi.mock('../../engine/stepRunner', () => ({
  resetSteps: vi.fn(),
  stepForward: vi.fn(),
}));

const { default: CodeEditor } = await import('../Editor/CodeEditor');

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

describe('CodeEditor', () => {
  it('renders the "Editor" header', () => {
    render(<CodeEditor />);
    expect(screen.getByText('Editor')).toBeInTheDocument();
  });

  it('renders the "Examples" label', () => {
    render(<CodeEditor />);
    expect(screen.getByText('Examples')).toBeInTheDocument();
  });

  it('renders preset selector with all presets', () => {
    render(<CodeEditor />);
    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
    const options = select.querySelectorAll('option');
    expect(options.length).toBe(Object.keys(PRESETS).length);
  });

  it('changing preset updates the store', () => {
    render(<CodeEditor />);
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'Classic Closure' } });
    expect(useEditorStore.getState().preset).toBe('Classic Closure');
    expect(useEditorStore.getState().code).toBe(PRESETS['Classic Closure']);
  });

  it('renders Monaco editor mock', () => {
    render(<CodeEditor />);
    expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
  });

  it('does not show EditorToolbar when stepMode is false', () => {
    render(<CodeEditor />);
    expect(screen.queryByText('Step')).not.toBeInTheDocument();
  });

  it('shows EditorToolbar when stepMode is true', () => {
    useEditorStore.setState({ stepMode: true, totalSteps: 5 });
    render(<CodeEditor />);
    expect(screen.getByText('Step')).toBeInTheDocument();
  });

  it('does not show step tooltip when not in step mode', () => {
    useExecutionStore.getState().setHighlightLine(1);
    useExecutionStore.getState().setStepTooltip('Test tooltip');
    render(<CodeEditor />);
    expect(screen.queryByText('→ Test tooltip')).not.toBeInTheDocument();
  });

  it('shows step tooltip in step mode when highlight and tooltip are set', () => {
    useEditorStore.setState({ stepMode: true, totalSteps: 5 });
    useExecutionStore.getState().setHighlightLine(1);
    useExecutionStore.getState().setStepTooltip('Program starts');
    render(<CodeEditor />);
    expect(screen.getByText('→ Program starts')).toBeInTheDocument();
  });

  it('does not show tooltip when highlightLine is null', () => {
    useEditorStore.setState({ stepMode: true, totalSteps: 5 });
    useExecutionStore.getState().setStepTooltip('tooltip');
    // highlightLine is null by default
    render(<CodeEditor />);
    expect(screen.queryByText('→ tooltip')).not.toBeInTheDocument();
  });

  it('preset selector shows current preset as selected', () => {
    render(<CodeEditor />);
    const select = screen.getByRole('combobox');
    expect(select.value).toBe('Event Loop Order');
  });

  it('all preset options have correct values', () => {
    render(<CodeEditor />);
    const options = screen.getByRole('combobox').querySelectorAll('option');
    const optionValues = Array.from(options).map(o => o.value);
    Object.keys(PRESETS).forEach(name => {
      expect(optionValues).toContain(name);
    });
  });
});
