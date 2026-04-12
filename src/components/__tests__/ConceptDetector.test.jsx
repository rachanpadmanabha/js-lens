import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import ConceptDetector from '../Intel/ConceptDetector';
import useEditorStore from '../../store/useEditorStore';

beforeEach(() => {
  vi.useFakeTimers();
  useEditorStore.setState({
    code: '',
    preset: 'Event Loop Order',
    stepMode: false,
    currentStep: 0,
    totalSteps: 0,
    isRunning: false,
    speed: 3,
  });
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'group').mockImplementation(() => {});
  vi.spyOn(console, 'groupEnd').mockImplementation(() => {});
});

afterEach(() => {
  vi.useRealTimers();
});

describe('ConceptDetector', () => {
  it('renders header', () => {
    render(<ConceptDetector />);
    expect(screen.getByText('Detected Concepts')).toBeInTheDocument();
  });

  it('shows placeholder when no code', () => {
    render(<ConceptDetector />);
    act(() => { vi.advanceTimersByTime(500); });
    expect(screen.getByText('Write some code to detect patterns')).toBeInTheDocument();
  });

  it('detects setTimeout as Event-driven after debounce', () => {
    useEditorStore.setState({ code: 'setTimeout(() => {}, 100);' });
    render(<ConceptDetector />);
    act(() => { vi.advanceTimersByTime(500); });
    expect(screen.getByText('Event-driven')).toBeInTheDocument();
  });

  it('detects Promise as Promise / Async', () => {
    useEditorStore.setState({ code: 'Promise.resolve().then(() => {});' });
    render(<ConceptDetector />);
    act(() => { vi.advanceTimersByTime(500); });
    expect(screen.getByText('Promise / Async')).toBeInTheDocument();
  });

  it('detects .map() as Higher-Order Function', () => {
    useEditorStore.setState({ code: '[1,2,3].map(x => x*2);' });
    render(<ConceptDetector />);
    act(() => { vi.advanceTimersByTime(500); });
    expect(screen.getByText('Higher-Order Function')).toBeInTheDocument();
  });

  it('detects class keyword as Prototype / Class', () => {
    useEditorStore.setState({ code: 'class Foo {}' });
    render(<ConceptDetector />);
    act(() => { vi.advanceTimersByTime(500); });
    expect(screen.getByText('Prototype / Class')).toBeInTheDocument();
  });

  it('detects function* as Generator', () => {
    useEditorStore.setState({ code: 'function* gen() { yield 1; }' });
    render(<ConceptDetector />);
    act(() => { vi.advanceTimersByTime(500); });
    expect(screen.getByText('Generator')).toBeInTheDocument();
  });

  it('shows count badge for detected concepts', () => {
    useEditorStore.setState({
      code: `
setTimeout(() => {}, 0);
Promise.resolve().then(() => {});
      `,
    });
    render(<ConceptDetector />);
    act(() => { vi.advanceTimersByTime(500); });
    // Should detect at least Event-driven and Promise/Async = 2
    const badges = screen.getAllByText(/^\d+$/);
    expect(badges.some((b) => Number(b.textContent) >= 2)).toBe(true);
  });

  it('hides placeholder when concepts detected', () => {
    useEditorStore.setState({ code: 'setTimeout(() => {}, 0);' });
    render(<ConceptDetector />);
    act(() => { vi.advanceTimersByTime(500); });
    expect(screen.queryByText('Write some code to detect patterns')).not.toBeInTheDocument();
  });
});
