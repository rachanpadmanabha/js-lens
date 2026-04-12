import { create } from 'zustand';

const useExecutionStore = create((set, get) => ({
  callStack: [],
  microtaskQueue: [],
  macrotaskQueue: [],
  webAPIs: [],
  scopeTree: { name: 'Global', type: 'global', variables: {}, children: [] },
  consoleOutput: [],
  eventLoopActive: false,
  highlightLine: null,
  stepTooltip: null,

  pushCallStack: (frame) =>
    set((state) => ({
      callStack: [...state.callStack, frame],
    })),

  popCallStack: () =>
    set((state) => ({
      callStack: state.callStack.slice(0, -1),
    })),

  setCallStack: (callStack) => set({ callStack }),

  addMicrotask: (task) =>
    set((state) => ({
      microtaskQueue: [...state.microtaskQueue, task],
    })),

  removeMicrotask: () =>
    set((state) => ({
      microtaskQueue: state.microtaskQueue.slice(1),
    })),

  setMicrotaskQueue: (microtaskQueue) => set({ microtaskQueue }),

  addMacrotask: (task) =>
    set((state) => ({
      macrotaskQueue: [...state.macrotaskQueue, task],
    })),

  removeMacrotask: () =>
    set((state) => ({
      macrotaskQueue: state.macrotaskQueue.slice(1),
    })),

  setMacrotaskQueue: (macrotaskQueue) => set({ macrotaskQueue }),

  addWebAPI: (api) =>
    set((state) => ({
      webAPIs: [...state.webAPIs, api],
    })),

  removeWebAPI: (id) =>
    set((state) => ({
      webAPIs: state.webAPIs.filter((a) => a.id !== id),
    })),

  updateWebAPI: (id, updates) =>
    set((state) => ({
      webAPIs: state.webAPIs.map((a) => (a.id === id ? { ...a, ...updates } : a)),
    })),

  setWebAPIs: (webAPIs) => set({ webAPIs }),

  setScopeTree: (scopeTreeOrFn) =>
    set((state) => ({
      scopeTree:
        typeof scopeTreeOrFn === 'function'
          ? scopeTreeOrFn(state.scopeTree)
          : scopeTreeOrFn,
    })),

  addConsoleOutput: (entry) =>
    set((state) => ({
      consoleOutput: [...state.consoleOutput, entry],
    })),

  clearConsole: () => set({ consoleOutput: [] }),

  setEventLoopActive: (active) => set({ eventLoopActive: active }),

  setHighlightLine: (line) => set({ highlightLine: line }),

  setStepTooltip: (tooltip) => set({ stepTooltip: tooltip }),

  resetExecution: () =>
    set({
      callStack: [],
      microtaskQueue: [],
      macrotaskQueue: [],
      webAPIs: [],
      scopeTree: { name: 'Global', type: 'global', variables: {}, children: [] },
      consoleOutput: [],
      eventLoopActive: false,
      highlightLine: null,
      stepTooltip: null,
    }),
}));

export default useExecutionStore;
