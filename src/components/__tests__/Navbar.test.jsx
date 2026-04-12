import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import useEditorStore from '../../store/useEditorStore';
import useExecutionStore from '../../store/useExecutionStore';
import { PRESETS } from '../../store/useEditorStore';

const mockResetSteps = vi.fn();
const mockRunAllSteps = vi.fn();
const mockPrepareSteps = vi.fn(() => []);

vi.mock('../../engine/stepRunner', () => ({
  runAllSteps: (...args) => mockRunAllSteps(...args),
  resetSteps: (...args) => mockResetSteps(...args),
  prepareSteps: (...args) => mockPrepareSteps(...args),
}));

// Import Navbar after mocking stepRunner
const { default: Navbar } = await import('../Navbar/Navbar');

beforeEach(() => {
  vi.clearAllMocks();
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

describe('Navbar', () => {
  it('renders the app title', () => {
    render(<Navbar />);
    expect(screen.getByText('JS Lens')).toBeInTheDocument();
  });

  it('renders the Run button', () => {
    render(<Navbar />);
    expect(screen.getByText('Run')).toBeInTheDocument();
  });

  it('renders the Reset button', () => {
    render(<Navbar />);
    expect(screen.getByTitle('Reset')).toBeInTheDocument();
  });

  it('renders the Step toggle', () => {
    render(<Navbar />);
    expect(screen.getByText('Step')).toBeInTheDocument();
  });

  it('renders the speed slider', () => {
    render(<Navbar />);
    const slider = screen.getByRole('slider');
    expect(slider).toBeInTheDocument();
    expect(slider.value).toBe('3');
  });

  it('shows "Running" text when isRunning is true', () => {
    useEditorStore.setState({ isRunning: true });
    render(<Navbar />);
    expect(screen.getByText('Running')).toBeInTheDocument();
  });

  it('disables Run button when running', () => {
    useEditorStore.setState({ isRunning: true });
    render(<Navbar />);
    const btn = screen.getByText('Running').closest('button');
    expect(btn).toBeDisabled();
  });

  it('clicking Step toggle changes step mode', () => {
    render(<Navbar />);
    const toggleBtn = screen.getByText('Step').closest('label').querySelector('button');
    fireEvent.click(toggleBtn);
    expect(useEditorStore.getState().stepMode).toBe(true);
  });

  it('changing speed slider updates store', () => {
    render(<Navbar />);
    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '5' } });
    expect(useEditorStore.getState().speed).toBe(5);
  });

  it('displays speed label matching slider value', () => {
    render(<Navbar />);
    expect(screen.getByText('2x')).toBeInTheDocument();
  });

  it('clicking Reset calls resetSteps', () => {
    render(<Navbar />);
    fireEvent.click(screen.getByTitle('Reset'));
    expect(mockResetSteps).toHaveBeenCalled();
  });
});
