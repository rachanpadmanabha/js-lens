import { describe, it, expect, beforeEach } from 'vitest';
import useEditorStore from '../useEditorStore';
import { PRESETS } from '../useEditorStore';

beforeEach(() => {
  // Reset store to initial state before each test
  useEditorStore.setState({
    code: PRESETS['Event Loop Order'],
    preset: 'Event Loop Order',
    stepMode: false,
    currentStep: 0,
    totalSteps: 0,
    isRunning: false,
    speed: 3,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 1. Initial state
// ─────────────────────────────────────────────────────────────────────────────
describe('useEditorStore — initial state', () => {
  it('has correct default values', () => {
    const state = useEditorStore.getState();
    expect(state.preset).toBe('Event Loop Order');
    expect(state.code).toBe(PRESETS['Event Loop Order']);
    expect(state.stepMode).toBe(false);
    expect(state.currentStep).toBe(0);
    expect(state.totalSteps).toBe(0);
    expect(state.isRunning).toBe(false);
    expect(state.speed).toBe(3);
  });

  it('code matches the default preset', () => {
    const state = useEditorStore.getState();
    expect(state.code).toContain("console.log('1 — sync')");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. PRESETS
// ─────────────────────────────────────────────────────────────────────────────
describe('useEditorStore — PRESETS', () => {
  it('exports PRESETS as an object', () => {
    expect(typeof PRESETS).toBe('object');
    expect(Object.keys(PRESETS).length).toBeGreaterThanOrEqual(8);
  });

  it('contains expected preset names', () => {
    const names = Object.keys(PRESETS);
    expect(names).toContain('Event Loop Order');
    expect(names).toContain('Classic Closure');
    expect(names).toContain('Promise Chain');
    expect(names).toContain('Async / Await');
    expect(names).toContain('setTimeout vs Promise');
    expect(names).toContain('Recursive Fibonacci');
    expect(names).toContain('IIFE Pattern');
    expect(names).toContain('Array HOF Chain');
    expect(names).toContain('Generator Function');
  });

  it('all presets have non-empty code', () => {
    Object.entries(PRESETS).forEach(([name, code]) => {
      expect(code.length).toBeGreaterThan(10);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. setCode
// ─────────────────────────────────────────────────────────────────────────────
describe('useEditorStore — setCode', () => {
  it('updates the code', () => {
    useEditorStore.getState().setCode('const x = 1;');
    expect(useEditorStore.getState().code).toBe('const x = 1;');
  });

  it('can set empty code', () => {
    useEditorStore.getState().setCode('');
    expect(useEditorStore.getState().code).toBe('');
  });

  it('does not change other state', () => {
    useEditorStore.getState().setCode('new code');
    const state = useEditorStore.getState();
    expect(state.stepMode).toBe(false);
    expect(state.isRunning).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. setPreset
// ─────────────────────────────────────────────────────────────────────────────
describe('useEditorStore — setPreset', () => {
  it('changes preset and code together', () => {
    useEditorStore.getState().setPreset('Classic Closure');
    const state = useEditorStore.getState();
    expect(state.preset).toBe('Classic Closure');
    expect(state.code).toBe(PRESETS['Classic Closure']);
  });

  it('handles unknown preset name gracefully', () => {
    useEditorStore.getState().setPreset('Nonexistent');
    const state = useEditorStore.getState();
    expect(state.preset).toBe('Nonexistent');
    expect(state.code).toBe('');
  });

  it('can switch between all presets', () => {
    Object.keys(PRESETS).forEach((name) => {
      useEditorStore.getState().setPreset(name);
      const state = useEditorStore.getState();
      expect(state.preset).toBe(name);
      expect(state.code).toBe(PRESETS[name]);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. Step mode
// ─────────────────────────────────────────────────────────────────────────────
describe('useEditorStore — step mode', () => {
  it('toggleStepMode flips the flag', () => {
    expect(useEditorStore.getState().stepMode).toBe(false);
    useEditorStore.getState().toggleStepMode();
    expect(useEditorStore.getState().stepMode).toBe(true);
    useEditorStore.getState().toggleStepMode();
    expect(useEditorStore.getState().stepMode).toBe(false);
  });

  it('setStepMode sets to specific value', () => {
    useEditorStore.getState().setStepMode(true);
    expect(useEditorStore.getState().stepMode).toBe(true);
    useEditorStore.getState().setStepMode(false);
    expect(useEditorStore.getState().stepMode).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. Step tracking
// ─────────────────────────────────────────────────────────────────────────────
describe('useEditorStore — step tracking', () => {
  it('setCurrentStep updates currentStep', () => {
    useEditorStore.getState().setCurrentStep(5);
    expect(useEditorStore.getState().currentStep).toBe(5);
  });

  it('setTotalSteps updates totalSteps', () => {
    useEditorStore.getState().setTotalSteps(20);
    expect(useEditorStore.getState().totalSteps).toBe(20);
  });

  it('allows currentStep to exceed totalSteps (no clamping)', () => {
    useEditorStore.getState().setTotalSteps(5);
    useEditorStore.getState().setCurrentStep(10);
    expect(useEditorStore.getState().currentStep).toBe(10);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. Running state
// ─────────────────────────────────────────────────────────────────────────────
describe('useEditorStore — isRunning', () => {
  it('setIsRunning updates the flag', () => {
    useEditorStore.getState().setIsRunning(true);
    expect(useEditorStore.getState().isRunning).toBe(true);
    useEditorStore.getState().setIsRunning(false);
    expect(useEditorStore.getState().isRunning).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. Speed
// ─────────────────────────────────────────────────────────────────────────────
describe('useEditorStore — speed', () => {
  it('default speed is 3', () => {
    expect(useEditorStore.getState().speed).toBe(3);
  });

  it('setSpeed changes the speed value', () => {
    useEditorStore.getState().setSpeed(1);
    expect(useEditorStore.getState().speed).toBe(1);
    useEditorStore.getState().setSpeed(5);
    expect(useEditorStore.getState().speed).toBe(5);
  });

  it('accepts all valid speed values (1-5)', () => {
    for (let i = 1; i <= 5; i++) {
      useEditorStore.getState().setSpeed(i);
      expect(useEditorStore.getState().speed).toBe(i);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 9. Reset
// ─────────────────────────────────────────────────────────────────────────────
describe('useEditorStore — reset', () => {
  it('resets step counters and isRunning', () => {
    useEditorStore.getState().setCurrentStep(10);
    useEditorStore.getState().setTotalSteps(20);
    useEditorStore.getState().setIsRunning(true);
    useEditorStore.getState().reset();

    const state = useEditorStore.getState();
    expect(state.currentStep).toBe(0);
    expect(state.totalSteps).toBe(0);
    expect(state.isRunning).toBe(false);
  });

  it('reloads code from current preset', () => {
    useEditorStore.getState().setPreset('Classic Closure');
    useEditorStore.getState().setCode('modified code');
    useEditorStore.getState().reset();
    expect(useEditorStore.getState().code).toBe(PRESETS['Classic Closure']);
  });

  it('preserves manually typed code if preset is unknown', () => {
    useEditorStore.getState().setPreset('Unknown');
    useEditorStore.getState().setCode('my custom code');
    useEditorStore.getState().reset();
    // With unknown preset, PRESETS[preset] returns undefined → falls back to state.code
    expect(useEditorStore.getState().code).toBe('my custom code');
  });

  it('does not change speed or stepMode', () => {
    useEditorStore.getState().setSpeed(5);
    useEditorStore.getState().setStepMode(true);
    useEditorStore.getState().reset();
    expect(useEditorStore.getState().speed).toBe(5);
    expect(useEditorStore.getState().stepMode).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 10. Edge cases
// ─────────────────────────────────────────────────────────────────────────────
describe('useEditorStore — edge cases', () => {
  it('setSpeed accepts out-of-range values without clamping (store is permissive)', () => {
    useEditorStore.getState().setSpeed(0);
    expect(useEditorStore.getState().speed).toBe(0);
    useEditorStore.getState().setSpeed(10);
    expect(useEditorStore.getState().speed).toBe(10);
    useEditorStore.getState().setSpeed(-1);
    expect(useEditorStore.getState().speed).toBe(-1);
  });

  it('setCode with multiline code', () => {
    const multiline = "const a = 1;\nconst b = 2;\nconsole.log(a + b);";
    useEditorStore.getState().setCode(multiline);
    expect(useEditorStore.getState().code).toBe(multiline);
  });

  it('rapid state updates do not lose data', () => {
    for (let i = 0; i < 100; i++) {
      useEditorStore.getState().setCurrentStep(i);
    }
    expect(useEditorStore.getState().currentStep).toBe(99);
  });

  it('setIsRunning twice to same value is idempotent', () => {
    useEditorStore.getState().setIsRunning(true);
    useEditorStore.getState().setIsRunning(true);
    expect(useEditorStore.getState().isRunning).toBe(true);
  });

  it('all 9 presets have valid JavaScript content', () => {
    expect(Object.keys(PRESETS).length).toBe(9);
    Object.entries(PRESETS).forEach(([name, code]) => {
      expect(typeof code).toBe('string');
      expect(code.trim().length).toBeGreaterThan(0);
    });
  });

  it('preset names are all unique', () => {
    const names = Object.keys(PRESETS);
    expect(new Set(names).size).toBe(names.length);
  });
});
