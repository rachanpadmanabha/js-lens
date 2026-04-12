// Generator-based step runner for step-by-step execution visualization

import useExecutionStore from '../store/useExecutionStore';
import useEditorStore from '../store/useEditorStore';
import { instrumentCode } from './codeInstrumentor';
import { runInSandbox } from './sandboxRunner';

let currentSteps = [];
let currentStepIndex = 0;
let consoleIdCounter = 0;

// Track all setTimeout ids so they can be cleared on reset/rerun
const pendingTimeouts = new Set();

function trackedTimeout(fn, delay) {
  const id = setTimeout(() => {
    pendingTimeouts.delete(id);
    fn();
  }, delay);
  pendingTimeouts.add(id);
  return id;
}

function clearAllPendingTimeouts() {
  pendingTimeouts.forEach((id) => clearTimeout(id));
  pendingTimeouts.clear();
}

// Maps speed slider (1–5) to delay in ms
function getDelay(speedValue, isEventLoop) {
  const base = [2000, 1200, 600, 250, 50][Math.max(0, Math.min(4, speedValue - 1))];
  return isEventLoop ? base * 1.5 : base;
}

function applyStep(step) {
  const store = useExecutionStore.getState();
  const speed = useEditorStore.getState().speed;
  const popDelay = getDelay(speed, false) * 0.6;

  switch (step.type) {
    case 'callstack_push':
      store.pushCallStack({
        id: step.id,
        name: step.name,
        line: step.line,
        detail: step.detail,
      });
      break;

    case 'callstack_pop':
      store.popCallStack();
      break;

    case 'microtask_add':
      store.addMicrotask({
        id: step.id,
        name: step.name,
        detail: step.detail,
        content: step.content,
      });
      break;

    case 'microtask_run':
      store.setEventLoopActive(true);
      store.removeMicrotask();
      store.pushCallStack({
        id: step.id,
        name: step.name,
        line: step.line,
        detail: step.detail,
      });
      trackedTimeout(() => {
        useExecutionStore.getState().popCallStack();
        useExecutionStore.getState().setEventLoopActive(false);
      }, popDelay);
      break;

    case 'macrotask_add':
      store.addMacrotask({
        id: step.id,
        name: step.name,
        detail: step.detail,
        sourceDelay: step.sourceDelay,
      });
      break;

    case 'macrotask_run':
      store.setEventLoopActive(true);
      store.removeMacrotask();
      store.pushCallStack({
        id: step.id,
        name: step.name,
        line: step.line,
        detail: step.detail,
      });
      trackedTimeout(() => {
        useExecutionStore.getState().popCallStack();
        useExecutionStore.getState().setEventLoopActive(false);
      }, popDelay);
      break;

    case 'webapi_add': {
      const speedNow = useEditorStore.getState().speed;
      const speedScale = [3, 2, 1, 0.5, 0.2][Math.max(0, Math.min(4, speedNow - 1))];
      const removeAfter = Math.max(200, Math.min(step.delay + 1000, 3000) * speedScale);
      store.addWebAPI({
        id: step.apiId || step.id,
        type: step.apiType,
        delay: step.delay,
        detail: step.detail,
        startTime: Date.now(),
      });
      trackedTimeout(() => {
        useExecutionStore.getState().removeWebAPI(step.apiId || step.id);
      }, removeAfter);
      break;
    }

    case 'scope_update':
      store.setScopeTree((prev) => {
        const tree = { ...prev };
        tree.variables = {
          ...tree.variables,
          [step.name]: {
            name: step.name,
            value: step.value,
            type: inferType(step.value),
          },
        };
        return tree;
      });
      break;

    case 'scope_push':
      store.setScopeTree((prev) => {
        const tree = JSON.parse(JSON.stringify(prev));
        tree.children = [
          ...tree.children,
          { name: step.name, type: 'function', variables: {}, children: [] },
        ];
        return tree;
      });
      break;

    case 'event_loop_tick':
      store.setEventLoopActive(true);
      trackedTimeout(() => {
        useExecutionStore.getState().setEventLoopActive(false);
      }, popDelay);
      break;

    case 'console':
      store.addConsoleOutput({
        id: `console-${++consoleIdCounter}`,
        level: step.level,
        text: step.text,
        timestamp: Date.now(),
      });
      break;

    default:
      break;
  }

  // Update highlight line
  if (step.line > 0) {
    store.setHighlightLine(step.line);
    store.setStepTooltip(step.detail || null);
  }
}

function inferType(value) {
  if (value === 'true' || value === 'false') return 'boolean';
  if (value === 'null') return 'null';
  if (value === 'undefined') return 'undefined';
  if (/^\d+(\.\d+)?$/.test(value)) return 'number';
  if (/^['"`]/.test(value)) return 'string';
  if (/^\[/.test(value)) return 'array';
  if (/^\{/.test(value)) return 'object';
  if (/^function|=>/.test(value)) return 'function';
  return 'unknown';
}

export function prepareSteps(code) {
  clearAllPendingTimeouts();
  currentSteps = instrumentCode(code);
  currentStepIndex = 0;
  useEditorStore.getState().setTotalSteps(currentSteps.length);
  useEditorStore.getState().setCurrentStep(0);
  return currentSteps;
}

export function stepForward() {
  if (currentStepIndex >= currentSteps.length) {
    return false;
  }

  const step = currentSteps[currentStepIndex];
  applyStep(step);
  currentStepIndex++;
  useEditorStore.getState().setCurrentStep(currentStepIndex);
  return currentStepIndex < currentSteps.length;
}

export function resetSteps() {
  clearAllPendingTimeouts();
  currentSteps = [];
  currentStepIndex = 0;
  consoleIdCounter = 0;
  useExecutionStore.getState().resetExecution();
  useEditorStore.getState().setCurrentStep(0);
  useEditorStore.getState().setTotalSteps(0);
}

export async function runAllSteps(code) {
  clearAllPendingTimeouts();
  const execStore = useExecutionStore.getState();

  execStore.resetExecution();
  consoleIdCounter = 0;
  useEditorStore.getState().setIsRunning(true);

  const steps = prepareSteps(code);

  // Run sandbox first so all console outputs are collected before stepping
  const sandboxOutputs = [];
  await runInSandbox(
    code,
    (output) => {
      sandboxOutputs.push(output);
    },
    (error) => {
      sandboxOutputs.push({ level: 'error', text: error.message, timestamp: Date.now() });
    }
  );

  const usedSandboxIndices = new Set();

  function extractLiteralPrefix(text) {
    const m = text.match(/^"([^"]+)"/);
    if (m) return m[1];
    const m2 = text.match(/^'([^']+)'/);
    if (m2) return m2[1];
    return null;
  }

  for (let i = 0; i < steps.length; i++) {
    if (!useEditorStore.getState().isRunning) {
      break;
    }

    const step = steps[i];

    // Match console steps to sandbox output by literal string prefix
    if (step.type === 'console') {
      const prefix = extractLiteralPrefix(step.text);
      let matchIdx = -1;
      if (prefix) {
        matchIdx = sandboxOutputs.findIndex((o, idx) =>
          !usedSandboxIndices.has(idx) && o.text.startsWith(prefix)
        );
      }
      if (matchIdx >= 0) {
        usedSandboxIndices.add(matchIdx);
        step.text = sandboxOutputs[matchIdx].text;
        step.level = sandboxOutputs[matchIdx].level;
      }
    }

    applyStep(step);
    useEditorStore.getState().setCurrentStep(i + 1);

    // Read speed each tick so slider changes take effect live
    const speed = useEditorStore.getState().speed;
    const delay = getDelay(speed, step.type.includes('event_loop'));
    await new Promise((r) => setTimeout(r, delay));
  }

  // Flush unmatched sandbox outputs
  const unmatchedIndices = [];
  for (let i = 0; i < sandboxOutputs.length; i++) {
    if (!usedSandboxIndices.has(i)) unmatchedIndices.push(i);
  }
  for (const idx of unmatchedIndices) {
    const out = sandboxOutputs[idx];
    useExecutionStore.getState().addConsoleOutput({
      id: `console-${++consoleIdCounter}`,
      level: out.level,
      text: out.text,
      timestamp: Date.now(),
    });
  }

  useEditorStore.getState().setIsRunning(false);
}
