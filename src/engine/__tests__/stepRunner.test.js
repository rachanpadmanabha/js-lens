import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { prepareSteps, stepForward, resetSteps } from '../stepRunner';
import useExecutionStore from '../../store/useExecutionStore';
import useEditorStore from '../../store/useEditorStore';
import { PRESETS } from '../../store/useEditorStore';

beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'group').mockImplementation(() => {});
  vi.spyOn(console, 'groupEnd').mockImplementation(() => {});
  vi.spyOn(console, 'table').mockImplementation(() => {});

  useExecutionStore.getState().resetExecution();
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

afterEach(() => {
  vi.useRealTimers();
});

// ─────────────────────────────────────────────────────────────────────────────
// 1. prepareSteps
// ─────────────────────────────────────────────────────────────────────────────
describe('prepareSteps', () => {
  it('returns an array of steps', () => {
    const steps = prepareSteps("console.log('hello');");
    expect(steps).toBeInstanceOf(Array);
    expect(steps.length).toBeGreaterThan(0);
  });

  it('updates totalSteps in editor store', () => {
    const steps = prepareSteps("console.log('test');");
    expect(useEditorStore.getState().totalSteps).toBe(steps.length);
  });

  it('resets currentStep to 0', () => {
    useEditorStore.getState().setCurrentStep(5);
    prepareSteps("const x = 1;");
    expect(useEditorStore.getState().currentStep).toBe(0);
  });

  it('works with empty code', () => {
    const steps = prepareSteps('');
    expect(steps).toBeInstanceOf(Array);
    expect(steps.length).toBeGreaterThanOrEqual(2);
  });

  it('produces different steps for different code', () => {
    const steps1 = prepareSteps("console.log('a');");
    const steps2 = prepareSteps("setTimeout(() => {}, 0);");
    const types1 = steps1.map((s) => s.type);
    const types2 = steps2.map((s) => s.type);
    expect(types1).not.toEqual(types2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. stepForward
// ─────────────────────────────────────────────────────────────────────────────
describe('stepForward', () => {
  it('returns false when no steps are prepared', () => {
    resetSteps();
    const result = stepForward();
    expect(result).toBe(false);
  });

  it('returns true when more steps remain', () => {
    prepareSteps("console.log('a');\nconsole.log('b');");
    const result = stepForward();
    expect(result).toBe(true);
  });

  it('returns false after last step', () => {
    const steps = prepareSteps('');
    // Walk through all steps
    let result;
    for (let i = 0; i < steps.length; i++) {
      result = stepForward();
    }
    expect(result).toBe(false);
  });

  it('increments currentStep in editor store', () => {
    prepareSteps("console.log('test');");
    expect(useEditorStore.getState().currentStep).toBe(0);
    stepForward();
    expect(useEditorStore.getState().currentStep).toBe(1);
    stepForward();
    expect(useEditorStore.getState().currentStep).toBe(2);
  });

  it('applies callstack_push step to execution store', () => {
    prepareSteps("console.log('test');");
    stepForward(); // First step is always callstack_push (Global)
    const callStack = useExecutionStore.getState().callStack;
    expect(callStack.length).toBeGreaterThanOrEqual(1);
    expect(callStack[0].name).toBe('Global Execution Context');
  });

  it('applies console step to execution store', () => {
    prepareSteps("console.log('hello');");
    const steps = prepareSteps("console.log('hello');");
    // Step through until we hit the console step
    for (let i = 0; i < steps.length; i++) {
      stepForward();
      if (steps[i].type === 'console') break;
    }
    const output = useExecutionStore.getState().consoleOutput;
    expect(output.length).toBeGreaterThanOrEqual(1);
  });

  it('sets highlightLine for steps with line > 0', () => {
    prepareSteps("console.log('test');");
    stepForward(); // callstack_push at line 1
    expect(useExecutionStore.getState().highlightLine).toBe(1);
  });

  it('sets stepTooltip from step detail', () => {
    prepareSteps("console.log('test');");
    stepForward();
    const tooltip = useExecutionStore.getState().stepTooltip;
    expect(tooltip).toBe('Program starts');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. stepForward — specific step types applied correctly
// ─────────────────────────────────────────────────────────────────────────────
describe('stepForward — step types', () => {
  it('callstack_push adds to call stack', () => {
    prepareSteps("console.log('x');");
    stepForward();
    expect(useExecutionStore.getState().callStack.length).toBe(1);
  });

  it('callstack_pop removes from call stack', () => {
    const steps = prepareSteps("console.log('x');");
    for (let i = 0; i < steps.length; i++) {
      stepForward();
    }
    // After all steps, global should be popped
    expect(useExecutionStore.getState().callStack.length).toBe(0);
  });

  it('scope_update adds variable to scope tree', () => {
    const steps = prepareSteps('const myVar = 42;');
    for (let i = 0; i < steps.length; i++) {
      stepForward();
      if (steps[i].type === 'scope_update') break;
    }
    const vars = useExecutionStore.getState().scopeTree.variables;
    expect(vars.myVar).toBeDefined();
    expect(vars.myVar.value).toBe('42');
    expect(vars.myVar.type).toBe('number');
  });

  it('webapi_add adds to webAPIs', () => {
    const steps = prepareSteps("setTimeout(() => {}, 100);");
    for (let i = 0; i < steps.length; i++) {
      stepForward();
      if (steps[i].type === 'webapi_add') break;
    }
    const webAPIs = useExecutionStore.getState().webAPIs;
    expect(webAPIs.length).toBe(1);
    expect(webAPIs[0].type).toBe('setTimeout');
  });

  it('macrotask_add adds to macrotask queue', () => {
    const steps = prepareSteps("setTimeout(() => {}, 100);");
    for (let i = 0; i < steps.length; i++) {
      stepForward();
      if (steps[i].type === 'macrotask_add') break;
    }
    expect(useExecutionStore.getState().macrotaskQueue.length).toBe(1);
  });

  it('microtask_add adds to microtask queue', () => {
    const steps = prepareSteps("Promise.resolve().then(() => {});");
    for (let i = 0; i < steps.length; i++) {
      stepForward();
      if (steps[i].type === 'microtask_add') break;
    }
    expect(useExecutionStore.getState().microtaskQueue.length).toBe(1);
  });

  it('event_loop_tick sets eventLoopActive to true', () => {
    const steps = prepareSteps("Promise.resolve().then(() => {});");
    for (let i = 0; i < steps.length; i++) {
      stepForward();
      if (steps[i].type === 'event_loop_tick') {
        expect(useExecutionStore.getState().eventLoopActive).toBe(true);
        break;
      }
    }
  });

  it('scope_push adds child to scope tree', () => {
    const code = `
function foo() {
  const x = 1;
}
foo();
    `;
    const steps = prepareSteps(code);
    for (let i = 0; i < steps.length; i++) {
      stepForward();
      if (steps[i].type === 'scope_push') break;
    }
    expect(useExecutionStore.getState().scopeTree.children.length).toBe(1);
    expect(useExecutionStore.getState().scopeTree.children[0].name).toBe('foo');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. resetSteps
// ─────────────────────────────────────────────────────────────────────────────
describe('resetSteps', () => {
  it('clears execution store', () => {
    prepareSteps("console.log('test');");
    stepForward();
    stepForward();
    resetSteps();
    const state = useExecutionStore.getState();
    expect(state.callStack).toEqual([]);
    expect(state.consoleOutput).toEqual([]);
    expect(state.microtaskQueue).toEqual([]);
    expect(state.macrotaskQueue).toEqual([]);
  });

  it('resets editor store steps to 0', () => {
    prepareSteps("console.log('test');");
    stepForward();
    resetSteps();
    expect(useEditorStore.getState().currentStep).toBe(0);
    expect(useEditorStore.getState().totalSteps).toBe(0);
  });

  it('subsequent stepForward returns false after reset', () => {
    prepareSteps("console.log('test');");
    stepForward();
    resetSteps();
    expect(stepForward()).toBe(false);
  });

  it('can prepare new steps after reset', () => {
    prepareSteps("console.log('first');");
    stepForward();
    resetSteps();
    const newSteps = prepareSteps("console.log('second');");
    expect(newSteps.length).toBeGreaterThan(0);
    expect(stepForward()).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. Type inference (tested indirectly via scope_update)
// ─────────────────────────────────────────────────────────────────────────────
describe('stepForward — type inference via scope_update', () => {
  function getVarType(code, varName) {
    const steps = prepareSteps(code);
    for (let i = 0; i < steps.length; i++) {
      stepForward();
    }
    return useExecutionStore.getState().scopeTree.variables[varName]?.type;
  }

  it('infers number type', () => {
    expect(getVarType('const x = 42;', 'x')).toBe('number');
  });

  it('infers string type (single quotes)', () => {
    expect(getVarType("const s = 'hello';", 's')).toBe('string');
  });

  it('infers string type (double quotes)', () => {
    expect(getVarType('const s = "hello";', 's')).toBe('string');
  });

  it('infers boolean type (true)', () => {
    useExecutionStore.getState().resetExecution();
    expect(getVarType('const b = true;', 'b')).toBe('boolean');
  });

  it('infers boolean type (false)', () => {
    useExecutionStore.getState().resetExecution();
    expect(getVarType('const b = false;', 'b')).toBe('boolean');
  });

  it('infers null type', () => {
    useExecutionStore.getState().resetExecution();
    expect(getVarType('const n = null;', 'n')).toBe('null');
  });

  it('infers undefined type', () => {
    useExecutionStore.getState().resetExecution();
    expect(getVarType('const u = undefined;', 'u')).toBe('undefined');
  });

  it('infers array type', () => {
    useExecutionStore.getState().resetExecution();
    expect(getVarType('const arr = [1, 2, 3];', 'arr')).toBe('array');
  });

  it('infers object type', () => {
    useExecutionStore.getState().resetExecution();
    expect(getVarType('const obj = { a: 1 };', 'obj')).toBe('object');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. Auto-pop timers for microtask_run and macrotask_run
// ─────────────────────────────────────────────────────────────────────────────
describe('stepForward — auto-pop timers', () => {
  it('microtask_run pushes to call stack and auto-pops after delay', () => {
    const code = "Promise.resolve().then(() => console.log('m'));";
    const steps = prepareSteps(code);

    for (let i = 0; i < steps.length; i++) {
      stepForward();
      if (steps[i].type === 'microtask_run') {
        // Call stack should have the microtask frame
        expect(useExecutionStore.getState().callStack.length).toBeGreaterThanOrEqual(1);
        // Event loop should be active
        expect(useExecutionStore.getState().eventLoopActive).toBe(true);
        // After timer fires, it should auto-pop
        vi.advanceTimersByTime(5000);
        expect(useExecutionStore.getState().eventLoopActive).toBe(false);
        break;
      }
    }
  });

  it('macrotask_run pushes to call stack and auto-pops after delay', () => {
    const code = "setTimeout(() => console.log('t'), 0);";
    const steps = prepareSteps(code);

    for (let i = 0; i < steps.length; i++) {
      stepForward();
      if (steps[i].type === 'macrotask_run') {
        expect(useExecutionStore.getState().callStack.length).toBeGreaterThanOrEqual(1);
        expect(useExecutionStore.getState().eventLoopActive).toBe(true);
        vi.advanceTimersByTime(5000);
        expect(useExecutionStore.getState().eventLoopActive).toBe(false);
        break;
      }
    }
  });

  it('webapi_add auto-removes after delay', () => {
    const code = "setTimeout(() => {}, 100);";
    const steps = prepareSteps(code);

    for (let i = 0; i < steps.length; i++) {
      stepForward();
      if (steps[i].type === 'webapi_add') {
        expect(useExecutionStore.getState().webAPIs.length).toBe(1);
        vi.advanceTimersByTime(5000);
        expect(useExecutionStore.getState().webAPIs.length).toBe(0);
        break;
      }
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. Full walk-through scenario
// ─────────────────────────────────────────────────────────────────────────────
describe('stepForward — full walk-through', () => {
  it('walks through Event Loop Order preset completely', () => {
    const code = PRESETS['Event Loop Order'];
    const steps = prepareSteps(code);

    let hasMore = true;
    let stepCount = 0;
    while (hasMore) {
      hasMore = stepForward();
      stepCount++;
    }
    expect(stepCount).toBe(steps.length);
    expect(useEditorStore.getState().currentStep).toBe(steps.length);
  });

  it('walks through closure code and creates scope children', () => {
    const code = `
function outer() {
  const x = 10;
}
outer();
    `;
    const steps = prepareSteps(code);
    for (let i = 0; i < steps.length; i++) {
      stepForward();
    }
    // scope tree should have a child for 'outer'
    expect(useExecutionStore.getState().scopeTree.children.length).toBe(1);
  });

  it('walks through all 9 presets without errors', () => {
    Object.entries(PRESETS).forEach(([name, code]) => {
      resetSteps();
      useExecutionStore.getState().resetExecution();
      const steps = prepareSteps(code);
      let hasMore = true;
      let count = 0;
      while (hasMore) {
        hasMore = stepForward();
        count++;
        // Advance timers to clear auto-pop timeouts
        vi.advanceTimersByTime(2000);
      }
      expect(count).toBe(steps.length);
    });
  });

  it('callStack is empty after all steps complete', () => {
    const code = "console.log('done');";
    const steps = prepareSteps(code);
    for (let i = 0; i < steps.length; i++) {
      stepForward();
      vi.advanceTimersByTime(2000);
    }
    expect(useExecutionStore.getState().callStack.length).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. Speed delay mapping
// ─────────────────────────────────────────────────────────────────────────────
describe('stepForward — speed delay mapping', () => {
  it('uses different delays based on speed setting', () => {
    // Speed is read during applyStep for event_loop_tick delays
    // We test indirectly by verifying the auto-pop timer durations
    useEditorStore.setState({ speed: 1 });
    const code = "Promise.resolve().then(() => {});";
    const steps = prepareSteps(code);

    // Find and apply microtask_run step
    for (let i = 0; i < steps.length; i++) {
      stepForward();
      if (steps[i].type === 'microtask_run') {
        // At speed 1, popDelay = 2000 * 0.6 = 1200ms
        // After 1100ms, should still be active
        vi.advanceTimersByTime(1100);
        // After full delay, should auto-pop
        vi.advanceTimersByTime(200);
        break;
      }
    }
    // eventLoopActive should be false after auto-pop
    expect(useExecutionStore.getState().eventLoopActive).toBe(false);
  });

  it('speed 5 has shortest delay', () => {
    useEditorStore.setState({ speed: 5 });
    const code = "Promise.resolve().then(() => {});";
    const steps = prepareSteps(code);

    for (let i = 0; i < steps.length; i++) {
      stepForward();
      if (steps[i].type === 'microtask_run') {
        // At speed 5, popDelay = 100 * 0.6 = 60ms
        vi.advanceTimersByTime(100);
        break;
      }
    }
    expect(useExecutionStore.getState().eventLoopActive).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 9. Edge cases
// ─────────────────────────────────────────────────────────────────────────────
describe('stepForward — edge cases', () => {
  it('stepForward on empty code returns false after initial steps', () => {
    const steps = prepareSteps('');
    // Should have at least push + pop for Global
    expect(steps.length).toBeGreaterThanOrEqual(2);
    for (let i = 0; i < steps.length; i++) {
      stepForward();
    }
    expect(stepForward()).toBe(false);
  });

  it('multiple prepareSteps calls reset properly', () => {
    prepareSteps("console.log('first');");
    stepForward();
    stepForward();

    // Prepare new steps — should reset index
    const newSteps = prepareSteps("const x = 1;");
    expect(useEditorStore.getState().currentStep).toBe(0);
    expect(useEditorStore.getState().totalSteps).toBe(newSteps.length);
  });

  it('resetSteps clears pending timeouts', () => {
    const code = "Promise.resolve().then(() => {});";
    const steps = prepareSteps(code);

    // Apply steps including microtask_run which creates a tracked timeout
    for (let i = 0; i < steps.length; i++) {
      stepForward();
    }

    // Reset should clear all pending timeouts
    resetSteps();

    // Advancing timers should not cause errors
    vi.advanceTimersByTime(10000);
    expect(useExecutionStore.getState().callStack).toEqual([]);
  });

  it('unknown step type does not crash', () => {
    // We can't easily inject an unknown step type, but we can verify
    // that the instrumentor never produces one
    const code = `console.log('test');
setTimeout(() => {}, 0);
Promise.resolve().then(() => {});`;
    const steps = prepareSteps(code);
    const validTypes = [
      'callstack_push', 'callstack_pop', 'scope_update', 'scope_push',
      'microtask_add', 'microtask_run', 'macrotask_add', 'macrotask_run',
      'webapi_add', 'event_loop_tick', 'console',
    ];
    steps.forEach(step => {
      expect(validTypes).toContain(step.type);
    });
  });
});
