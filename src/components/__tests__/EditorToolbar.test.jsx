import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import useEditorStore from '../../store/useEditorStore';

const mockStepForward = vi.fn();

vi.mock('../../engine/stepRunner', () => ({
  stepForward: (...args) => mockStepForward(...args),
}));

const { default: EditorToolbar } = await import('../Editor/EditorToolbar');

beforeEach(() => {
  vi.clearAllMocks();
  useEditorStore.setState({
    stepMode: true,
    currentStep: 0,
    totalSteps: 10,
  });
});

describe('EditorToolbar', () => {
  it('renders nothing when stepMode is false', () => {
    useEditorStore.setState({ stepMode: false });
    const { container } = render(<EditorToolbar />);
    expect(container.innerHTML).toBe('');
  });

  it('renders Step button when stepMode is true', () => {
    render(<EditorToolbar />);
    expect(screen.getByText('Step')).toBeInTheDocument();
  });

  it('shows step counter', () => {
    useEditorStore.setState({ currentStep: 3, totalSteps: 10 });
    render(<EditorToolbar />);
    expect(screen.getByText('Step 3 / 10')).toBeInTheDocument();
  });

  it('clicking Step calls stepForward', () => {
    render(<EditorToolbar />);
    fireEvent.click(screen.getByText('Step'));
    expect(mockStepForward).toHaveBeenCalled();
  });

  it('disables Step button when all steps consumed', () => {
    useEditorStore.setState({ currentStep: 10, totalSteps: 10 });
    render(<EditorToolbar />);
    const btn = screen.getByText('Step').closest('button');
    expect(btn).toBeDisabled();
  });

  it('enables Step button when steps remain', () => {
    useEditorStore.setState({ currentStep: 5, totalSteps: 10 });
    render(<EditorToolbar />);
    const btn = screen.getByText('Step').closest('button');
    expect(btn).not.toBeDisabled();
  });

  it('does not show step counter when totalSteps is 0', () => {
    useEditorStore.setState({ currentStep: 0, totalSteps: 0 });
    render(<EditorToolbar />);
    expect(screen.queryByText(/Step \d+ \/ \d+/)).not.toBeInTheDocument();
  });
});
