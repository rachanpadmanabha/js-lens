import { describe, it, expect, beforeEach } from 'vitest';
import useExecutionStore from '../useExecutionStore';

beforeEach(() => {
  useExecutionStore.getState().resetExecution();
});

// ─────────────────────────────────────────────────────────────────────────────
// 1. Initial / reset state
// ─────────────────────────────────────────────────────────────────────────────
describe('useExecutionStore — initial state', () => {
  it('starts with empty arrays and null values', () => {
    const state = useExecutionStore.getState();
    expect(state.callStack).toEqual([]);
    expect(state.microtaskQueue).toEqual([]);
    expect(state.macrotaskQueue).toEqual([]);
    expect(state.webAPIs).toEqual([]);
    expect(state.consoleOutput).toEqual([]);
    expect(state.eventLoopActive).toBe(false);
    expect(state.highlightLine).toBeNull();
    expect(state.stepTooltip).toBeNull();
  });

  it('has a default global scope tree', () => {
    const state = useExecutionStore.getState();
    expect(state.scopeTree).toEqual({
      name: 'Global',
      type: 'global',
      variables: {},
      children: [],
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Call stack
// ─────────────────────────────────────────────────────────────────────────────
describe('useExecutionStore — call stack', () => {
  it('pushCallStack adds a frame', () => {
    useExecutionStore.getState().pushCallStack({ id: 1, name: 'main()' });
    expect(useExecutionStore.getState().callStack).toHaveLength(1);
    expect(useExecutionStore.getState().callStack[0].name).toBe('main()');
  });

  it('pushCallStack appends to the end (stack top)', () => {
    const store = useExecutionStore.getState();
    store.pushCallStack({ id: 1, name: 'a()' });
    store.pushCallStack({ id: 2, name: 'b()' });
    store.pushCallStack({ id: 3, name: 'c()' });
    const stack = useExecutionStore.getState().callStack;
    expect(stack.map((f) => f.name)).toEqual(['a()', 'b()', 'c()']);
  });

  it('popCallStack removes the last frame', () => {
    const store = useExecutionStore.getState();
    store.pushCallStack({ id: 1, name: 'a()' });
    store.pushCallStack({ id: 2, name: 'b()' });
    store.popCallStack();
    const stack = useExecutionStore.getState().callStack;
    expect(stack).toHaveLength(1);
    expect(stack[0].name).toBe('a()');
  });

  it('popCallStack on empty stack produces empty array', () => {
    useExecutionStore.getState().popCallStack();
    expect(useExecutionStore.getState().callStack).toEqual([]);
  });

  it('setCallStack replaces the entire stack', () => {
    useExecutionStore.getState().setCallStack([
      { id: 10, name: 'x()' },
      { id: 11, name: 'y()' },
    ]);
    expect(useExecutionStore.getState().callStack).toHaveLength(2);
  });

  it('multiple push/pop cycles work correctly', () => {
    const store = useExecutionStore.getState();
    store.pushCallStack({ id: 1, name: 'global' });
    store.pushCallStack({ id: 2, name: 'foo()' });
    store.pushCallStack({ id: 3, name: 'bar()' });
    store.popCallStack();
    store.popCallStack();
    expect(useExecutionStore.getState().callStack).toHaveLength(1);
    expect(useExecutionStore.getState().callStack[0].name).toBe('global');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Microtask queue
// ─────────────────────────────────────────────────────────────────────────────
describe('useExecutionStore — microtask queue', () => {
  it('addMicrotask appends to the queue', () => {
    useExecutionStore.getState().addMicrotask({ id: 1, name: '.then()' });
    expect(useExecutionStore.getState().microtaskQueue).toHaveLength(1);
  });

  it('removeMicrotask removes from the front (FIFO)', () => {
    const store = useExecutionStore.getState();
    store.addMicrotask({ id: 1, name: 'first' });
    store.addMicrotask({ id: 2, name: 'second' });
    store.removeMicrotask();
    const queue = useExecutionStore.getState().microtaskQueue;
    expect(queue).toHaveLength(1);
    expect(queue[0].name).toBe('second');
  });

  it('removeMicrotask on empty queue is safe', () => {
    useExecutionStore.getState().removeMicrotask();
    expect(useExecutionStore.getState().microtaskQueue).toEqual([]);
  });

  it('setMicrotaskQueue replaces the entire queue', () => {
    useExecutionStore.getState().setMicrotaskQueue([
      { id: 5, name: 'custom' },
    ]);
    expect(useExecutionStore.getState().microtaskQueue).toHaveLength(1);
  });

  it('preserves FIFO order across multiple adds', () => {
    const store = useExecutionStore.getState();
    store.addMicrotask({ id: 1, name: 'a' });
    store.addMicrotask({ id: 2, name: 'b' });
    store.addMicrotask({ id: 3, name: 'c' });
    const names = useExecutionStore.getState().microtaskQueue.map((t) => t.name);
    expect(names).toEqual(['a', 'b', 'c']);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Macrotask queue
// ─────────────────────────────────────────────────────────────────────────────
describe('useExecutionStore — macrotask queue', () => {
  it('addMacrotask appends to the queue', () => {
    useExecutionStore.getState().addMacrotask({ id: 1, name: 'setTimeout cb' });
    expect(useExecutionStore.getState().macrotaskQueue).toHaveLength(1);
  });

  it('removeMacrotask removes from the front (FIFO)', () => {
    const store = useExecutionStore.getState();
    store.addMacrotask({ id: 1, name: 'first' });
    store.addMacrotask({ id: 2, name: 'second' });
    store.removeMacrotask();
    const queue = useExecutionStore.getState().macrotaskQueue;
    expect(queue).toHaveLength(1);
    expect(queue[0].name).toBe('second');
  });

  it('removeMacrotask on empty queue is safe', () => {
    useExecutionStore.getState().removeMacrotask();
    expect(useExecutionStore.getState().macrotaskQueue).toEqual([]);
  });

  it('setMacrotaskQueue replaces the entire queue', () => {
    useExecutionStore.getState().setMacrotaskQueue([
      { id: 10, name: 'timer1' },
      { id: 11, name: 'timer2' },
    ]);
    expect(useExecutionStore.getState().macrotaskQueue).toHaveLength(2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. Web APIs
// ─────────────────────────────────────────────────────────────────────────────
describe('useExecutionStore — Web APIs', () => {
  it('addWebAPI adds an entry', () => {
    useExecutionStore.getState().addWebAPI({ id: 1, type: 'setTimeout', delay: 1000 });
    expect(useExecutionStore.getState().webAPIs).toHaveLength(1);
  });

  it('removeWebAPI removes by id', () => {
    const store = useExecutionStore.getState();
    store.addWebAPI({ id: 1, type: 'setTimeout', delay: 100 });
    store.addWebAPI({ id: 2, type: 'setInterval', delay: 500 });
    store.removeWebAPI(1);
    const apis = useExecutionStore.getState().webAPIs;
    expect(apis).toHaveLength(1);
    expect(apis[0].id).toBe(2);
  });

  it('removeWebAPI with non-existent id does nothing', () => {
    useExecutionStore.getState().addWebAPI({ id: 1, type: 'setTimeout', delay: 100 });
    useExecutionStore.getState().removeWebAPI(999);
    expect(useExecutionStore.getState().webAPIs).toHaveLength(1);
  });

  it('updateWebAPI merges updates into matching entry', () => {
    useExecutionStore.getState().addWebAPI({ id: 1, type: 'setTimeout', delay: 100 });
    useExecutionStore.getState().updateWebAPI(1, { delay: 200, detail: 'updated' });
    const api = useExecutionStore.getState().webAPIs[0];
    expect(api.delay).toBe(200);
    expect(api.detail).toBe('updated');
    expect(api.type).toBe('setTimeout');
  });

  it('updateWebAPI does not affect other entries', () => {
    const store = useExecutionStore.getState();
    store.addWebAPI({ id: 1, type: 'setTimeout', delay: 100 });
    store.addWebAPI({ id: 2, type: 'setInterval', delay: 500 });
    store.updateWebAPI(1, { delay: 999 });
    const apis = useExecutionStore.getState().webAPIs;
    expect(apis[0].delay).toBe(999);
    expect(apis[1].delay).toBe(500);
  });

  it('setWebAPIs replaces the entire list', () => {
    useExecutionStore.getState().setWebAPIs([
      { id: 100, type: 'fetch' },
    ]);
    expect(useExecutionStore.getState().webAPIs).toHaveLength(1);
    expect(useExecutionStore.getState().webAPIs[0].type).toBe('fetch');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. Scope tree
// ─────────────────────────────────────────────────────────────────────────────
describe('useExecutionStore — scope tree', () => {
  it('setScopeTree with object replaces tree', () => {
    const newTree = { name: 'Custom', type: 'custom', variables: {}, children: [] };
    useExecutionStore.getState().setScopeTree(newTree);
    expect(useExecutionStore.getState().scopeTree).toEqual(newTree);
  });

  it('setScopeTree with function receives prev state', () => {
    useExecutionStore.getState().setScopeTree((prev) => ({
      ...prev,
      variables: { x: { name: 'x', value: '42', type: 'number' } },
    }));
    const tree = useExecutionStore.getState().scopeTree;
    expect(tree.variables.x.value).toBe('42');
    expect(tree.name).toBe('Global');
  });

  it('setScopeTree function can add children', () => {
    useExecutionStore.getState().setScopeTree((prev) => ({
      ...prev,
      children: [
        ...prev.children,
        { name: 'foo', type: 'function', variables: {}, children: [] },
      ],
    }));
    const tree = useExecutionStore.getState().scopeTree;
    expect(tree.children).toHaveLength(1);
    expect(tree.children[0].name).toBe('foo');
  });

  it('multiple scope updates accumulate variables', () => {
    const store = useExecutionStore.getState();
    store.setScopeTree((prev) => ({
      ...prev,
      variables: { ...prev.variables, a: { name: 'a', value: '1', type: 'number' } },
    }));
    store.setScopeTree((prev) => ({
      ...prev,
      variables: { ...prev.variables, b: { name: 'b', value: '2', type: 'number' } },
    }));
    const vars = useExecutionStore.getState().scopeTree.variables;
    expect(Object.keys(vars)).toEqual(['a', 'b']);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. Console output
// ─────────────────────────────────────────────────────────────────────────────
describe('useExecutionStore — console output', () => {
  it('addConsoleOutput appends entries', () => {
    useExecutionStore.getState().addConsoleOutput({ id: 1, level: 'log', text: 'hello' });
    expect(useExecutionStore.getState().consoleOutput).toHaveLength(1);
  });

  it('addConsoleOutput preserves order', () => {
    const store = useExecutionStore.getState();
    store.addConsoleOutput({ id: 1, level: 'log', text: 'first' });
    store.addConsoleOutput({ id: 2, level: 'warn', text: 'second' });
    store.addConsoleOutput({ id: 3, level: 'error', text: 'third' });
    const output = useExecutionStore.getState().consoleOutput;
    expect(output.map((o) => o.text)).toEqual(['first', 'second', 'third']);
    expect(output.map((o) => o.level)).toEqual(['log', 'warn', 'error']);
  });

  it('clearConsole empties the output', () => {
    useExecutionStore.getState().addConsoleOutput({ id: 1, level: 'log', text: 'test' });
    useExecutionStore.getState().clearConsole();
    expect(useExecutionStore.getState().consoleOutput).toEqual([]);
  });

  it('clearConsole on already empty output is safe', () => {
    useExecutionStore.getState().clearConsole();
    expect(useExecutionStore.getState().consoleOutput).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. Event loop active flag
// ─────────────────────────────────────────────────────────────────────────────
describe('useExecutionStore — event loop active', () => {
  it('setEventLoopActive toggles the flag', () => {
    useExecutionStore.getState().setEventLoopActive(true);
    expect(useExecutionStore.getState().eventLoopActive).toBe(true);
    useExecutionStore.getState().setEventLoopActive(false);
    expect(useExecutionStore.getState().eventLoopActive).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 9. Highlight line & step tooltip
// ─────────────────────────────────────────────────────────────────────────────
describe('useExecutionStore — highlight and tooltip', () => {
  it('setHighlightLine sets the line number', () => {
    useExecutionStore.getState().setHighlightLine(5);
    expect(useExecutionStore.getState().highlightLine).toBe(5);
  });

  it('setHighlightLine with null clears highlight', () => {
    useExecutionStore.getState().setHighlightLine(5);
    useExecutionStore.getState().setHighlightLine(null);
    expect(useExecutionStore.getState().highlightLine).toBeNull();
  });

  it('setStepTooltip sets tooltip text', () => {
    useExecutionStore.getState().setStepTooltip('Entering foo()');
    expect(useExecutionStore.getState().stepTooltip).toBe('Entering foo()');
  });

  it('setStepTooltip with null clears tooltip', () => {
    useExecutionStore.getState().setStepTooltip('test');
    useExecutionStore.getState().setStepTooltip(null);
    expect(useExecutionStore.getState().stepTooltip).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 10. resetExecution
// ─────────────────────────────────────────────────────────────────────────────
describe('useExecutionStore — resetExecution', () => {
  it('clears all state back to initial', () => {
    const store = useExecutionStore.getState();
    store.pushCallStack({ id: 1, name: 'test' });
    store.addMicrotask({ id: 2, name: 'micro' });
    store.addMacrotask({ id: 3, name: 'macro' });
    store.addWebAPI({ id: 4, type: 'setTimeout' });
    store.addConsoleOutput({ id: 5, level: 'log', text: 'output' });
    store.setEventLoopActive(true);
    store.setHighlightLine(10);
    store.setStepTooltip('tooltip');
    store.setScopeTree({ name: 'Custom', type: 'custom', variables: { x: 1 }, children: [] });

    store.resetExecution();

    const reset = useExecutionStore.getState();
    expect(reset.callStack).toEqual([]);
    expect(reset.microtaskQueue).toEqual([]);
    expect(reset.macrotaskQueue).toEqual([]);
    expect(reset.webAPIs).toEqual([]);
    expect(reset.consoleOutput).toEqual([]);
    expect(reset.eventLoopActive).toBe(false);
    expect(reset.highlightLine).toBeNull();
    expect(reset.stepTooltip).toBeNull();
    expect(reset.scopeTree).toEqual({
      name: 'Global',
      type: 'global',
      variables: {},
      children: [],
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 11. Immutability — state updates produce new references
// ─────────────────────────────────────────────────────────────────────────────
describe('useExecutionStore — immutability', () => {
  it('pushCallStack produces a new array reference', () => {
    const before = useExecutionStore.getState().callStack;
    useExecutionStore.getState().pushCallStack({ id: 1, name: 'test' });
    const after = useExecutionStore.getState().callStack;
    expect(before).not.toBe(after);
  });

  it('addMicrotask produces a new array reference', () => {
    const before = useExecutionStore.getState().microtaskQueue;
    useExecutionStore.getState().addMicrotask({ id: 1, name: 'test' });
    const after = useExecutionStore.getState().microtaskQueue;
    expect(before).not.toBe(after);
  });

  it('addConsoleOutput produces a new array reference', () => {
    const before = useExecutionStore.getState().consoleOutput;
    useExecutionStore.getState().addConsoleOutput({ id: 1, level: 'log', text: 'x' });
    const after = useExecutionStore.getState().consoleOutput;
    expect(before).not.toBe(after);
  });

  it('addMacrotask produces a new array reference', () => {
    const before = useExecutionStore.getState().macrotaskQueue;
    useExecutionStore.getState().addMacrotask({ id: 1, name: 'test' });
    const after = useExecutionStore.getState().macrotaskQueue;
    expect(before).not.toBe(after);
  });

  it('addWebAPI produces a new array reference', () => {
    const before = useExecutionStore.getState().webAPIs;
    useExecutionStore.getState().addWebAPI({ id: 1, type: 'setTimeout' });
    const after = useExecutionStore.getState().webAPIs;
    expect(before).not.toBe(after);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 12. Rapid successive updates
// ─────────────────────────────────────────────────────────────────────────────
describe('useExecutionStore — rapid updates', () => {
  it('rapid push/pop cycles maintain consistency', () => {
    const store = useExecutionStore.getState();
    for (let i = 0; i < 50; i++) {
      store.pushCallStack({ id: i, name: `f${i}()` });
    }
    expect(useExecutionStore.getState().callStack).toHaveLength(50);
    for (let i = 0; i < 50; i++) {
      store.popCallStack();
    }
    expect(useExecutionStore.getState().callStack).toHaveLength(0);
  });

  it('rapid microtask add/remove maintains FIFO', () => {
    const store = useExecutionStore.getState();
    for (let i = 0; i < 10; i++) {
      store.addMicrotask({ id: i, name: `task-${i}` });
    }
    expect(useExecutionStore.getState().microtaskQueue).toHaveLength(10);
    expect(useExecutionStore.getState().microtaskQueue[0].name).toBe('task-0');
    expect(useExecutionStore.getState().microtaskQueue[9].name).toBe('task-9');

    for (let i = 0; i < 5; i++) {
      store.removeMicrotask();
    }
    expect(useExecutionStore.getState().microtaskQueue).toHaveLength(5);
    expect(useExecutionStore.getState().microtaskQueue[0].name).toBe('task-5');
  });

  it('rapid console output additions preserve all entries', () => {
    const store = useExecutionStore.getState();
    for (let i = 0; i < 100; i++) {
      store.addConsoleOutput({ id: i, level: 'log', text: `msg-${i}`, timestamp: i });
    }
    expect(useExecutionStore.getState().consoleOutput).toHaveLength(100);
    expect(useExecutionStore.getState().consoleOutput[0].text).toBe('msg-0');
    expect(useExecutionStore.getState().consoleOutput[99].text).toBe('msg-99');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 13. Scope tree edge cases
// ─────────────────────────────────────────────────────────────────────────────
describe('useExecutionStore — scope tree edge cases', () => {
  it('overwriting a variable in scope tree updates the value', () => {
    const store = useExecutionStore.getState();
    store.setScopeTree((prev) => ({
      ...prev,
      variables: { ...prev.variables, x: { name: 'x', value: '1', type: 'number' } },
    }));
    store.setScopeTree((prev) => ({
      ...prev,
      variables: { ...prev.variables, x: { name: 'x', value: '2', type: 'number' } },
    }));
    expect(useExecutionStore.getState().scopeTree.variables.x.value).toBe('2');
  });

  it('deeply nested scope tree can be set', () => {
    const deepTree = {
      name: 'Global',
      type: 'global',
      variables: {},
      children: [{
        name: 'a',
        type: 'function',
        variables: {},
        children: [{
          name: 'b',
          type: 'function',
          variables: {},
          children: [{
            name: 'c',
            type: 'function',
            variables: { deep: { name: 'deep', value: 'true', type: 'boolean' } },
            children: [],
          }],
        }],
      }],
    };
    useExecutionStore.getState().setScopeTree(deepTree);
    const tree = useExecutionStore.getState().scopeTree;
    expect(tree.children[0].children[0].children[0].variables.deep.value).toBe('true');
  });
});
