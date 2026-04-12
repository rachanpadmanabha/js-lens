// Generates execution steps by analyzing code and simulating runtime behavior.
// This creates a sequence of visualization events for the step-by-step visualizer.

let stepIdCounter = 0;

function nextId() {
  return ++stepIdCounter;
}

export function instrumentCode(code) {
  stepIdCounter = 0;
  const lines = code.split('\n');
  const steps = [];
  const scopeStack = [{ name: 'Global', variables: {} }];

  function stripCommentsAndStrings(line) {
    return line.replace(/\/\/.*$/, '').replace(/(["'`])(?:(?!\1|\\).|\\.)*\1/g, '');
  }

  // Find brace-delimited body starting at lineIdx.
  // Returns { startLine, endLine } (0-based, inclusive).
  function findBraceBody(lineIdx) {
    let depth = 0;
    for (let i = lineIdx; i < lines.length; i++) {
      const stripped = stripCommentsAndStrings(lines[i]);
      for (const ch of stripped) {
        if (ch === '{') depth++;
        if (ch === '}') {
          depth--;
          if (depth === 0) return { startLine: lineIdx, endLine: i };
        }
      }
    }
    return null;
  }

  // Extract single-expression inline arrows like:
  //   setTimeout(() => console.log('x'), 0)
  function extractInlineExpression(line) {
    const m = line.match(/=>\s*([^{,][^,]*?)(?:\s*\)|,\s*\d+\s*\))?\s*;?\s*$/);
    if (m) return m[1].trim();
    return null;
  }

  // ── Phase 1: identify function definitions ────────────────────────────
  const funcDefs = {}; // name → { name, params, startLine, endLine, isAsync, isGenerator }

  lines.forEach((line, idx) => {
    const funcMatch = line.match(
      /(?:async\s+)?function\s*\*?\s+(\w+)\s*\(([^)]*)\)/
    );
    if (funcMatch) {
      const body = findBraceBody(idx);
      funcDefs[funcMatch[1]] = {
        name: funcMatch[1],
        params: funcMatch[2]
          .split(',')
          .map((p) => p.trim())
          .filter(Boolean),
        startLine: idx,
        endLine: body ? body.endLine : idx,
        isAsync: line.includes('async'),
        isGenerator: line.includes('*'),
      };
    }

    // const/let/var name = function / arrow
    const constFuncMatch = line.match(
      /(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?(?:function\s*\w*\s*\(([^)]*)\)|\(([^)]*)\)\s*=>|(\w+)\s*=>)/
    );
    if (constFuncMatch) {
      const body = findBraceBody(idx);
      funcDefs[constFuncMatch[1]] = {
        name: constFuncMatch[1],
        params: (constFuncMatch[2] || constFuncMatch[3] || constFuncMatch[4] || '')
          .split(',')
          .map((p) => p.trim())
          .filter(Boolean),
        startLine: idx,
        endLine: body ? body.endLine : idx,
        isAsync: line.includes('async'),
        isGenerator: false,
      };
    }

    // IIFE: (function() { ... })() or (async function() { ... })()
    if (!funcMatch && !constFuncMatch) {
      const iifeMatch = line.match(/^\s*\(\s*(async\s+)?function\s*\*?\s*\w*\s*\(([^)]*)\)/);
      if (iifeMatch) {
        const body = findBraceBody(idx);
        if (body) {
          const syntheticName = iifeMatch[1] ? `__async_iife_${idx}` : `__iife_${idx}`;
          funcDefs[syntheticName] = {
            name: syntheticName,
            displayName: iifeMatch[1] ? 'async IIFE' : 'IIFE',
            params: (iifeMatch[2] || '').split(',').map(p => p.trim()).filter(Boolean),
            startLine: idx,
            endLine: body.endLine,
            isAsync: !!iifeMatch[1],
            isGenerator: line.includes('*'),
            isIIFE: true,
          };
        }
      }
    }
  });

  // ── Phase 2: collect async callback ranges everywhere ─────────────────
  // Unlike the previous version, we scan ALL lines (including inside function
  // bodies) so that setTimeout / .then / queueMicrotask inside functions get
  // proper callback ranges.  The skipRanges for the top-level pass are built
  // from funcDef bodies + top-level async callback bodies only.

  const asyncCallbackRanges = []; // { startLine, endLine, kind, inlineExpr? }

  // Build skip-ranges for the top-level walk
  const skipRanges = []; // { startLine, endLine } (0-based, inclusive)

  // 1) All function definition bodies are skipped at top level
  Object.values(funcDefs).forEach((def) => {
    if (def.endLine > def.startLine) {
      skipRanges.push({ startLine: def.startLine + 1, endLine: def.endLine });
    }
  });

  // 2) Scan every line for setTimeout / setInterval / .then / queueMicrotask
  //    and collect callback ranges.  We check against the stripped line (no
  //    string contents) to avoid false positives like console.log("queueMicrotask").
  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    const stripped = stripCommentsAndStrings(trimmed);

    if (stripped.includes('setTimeout') || stripped.includes('setInterval')) {
      const range = findBraceBody(idx);
      if (range && range.endLine > idx) {
        asyncCallbackRanges.push({ startLine: idx, endLine: range.endLine, kind: 'macrotask' });
        // Only add to skipRanges if this is at top level (not inside a function def)
        if (!isInsideFuncDef(idx)) {
          skipRanges.push({ startLine: idx + 1, endLine: range.endLine });
        }
      } else {
        const expr = extractInlineExpression(trimmed);
        if (expr) {
          asyncCallbackRanges.push({ startLine: idx, endLine: idx, kind: 'macrotask', inlineExpr: expr });
        }
      }
    }

    if (stripped.includes('.then(') || stripped.includes('.then (')) {
      const range = findBraceBody(idx);
      if (range && range.endLine > idx) {
        asyncCallbackRanges.push({ startLine: idx, endLine: range.endLine, kind: 'microtask' });
        if (!isInsideFuncDef(idx)) {
          skipRanges.push({ startLine: idx + 1, endLine: range.endLine });
        }
      } else {
        const expr = extractInlineExpression(trimmed);
        if (expr) {
          asyncCallbackRanges.push({ startLine: idx, endLine: idx, kind: 'microtask', inlineExpr: expr });
        }
      }
    }

    if (stripped.includes('queueMicrotask')) {
      const range = findBraceBody(idx);
      if (range && range.endLine > idx) {
        asyncCallbackRanges.push({ startLine: idx, endLine: range.endLine, kind: 'microtask' });
        if (!isInsideFuncDef(idx)) {
          skipRanges.push({ startLine: idx + 1, endLine: range.endLine });
        }
      } else {
        const expr = extractInlineExpression(trimmed);
        if (expr) {
          asyncCallbackRanges.push({ startLine: idx, endLine: idx, kind: 'microtask', inlineExpr: expr });
        }
      }
    }
  });

  function isInsideFuncDef(lineIdx) {
    return Object.values(funcDefs).some(
      (def) => lineIdx > def.startLine && lineIdx <= def.endLine
    );
  }

  function shouldSkipLine(lineIdx) {
    return skipRanges.some(
      (r) => lineIdx >= r.startLine && lineIdx <= r.endLine
    );
  }

  // Check if a line is inside an async callback range (setTimeout/then/queueMicrotask body)
  function isInsideAsyncCallback(lineIdx) {
    return asyncCallbackRanges.some(
      (r) => lineIdx > r.startLine && lineIdx <= r.endLine
    );
  }

  // Find the callback range starting at a given line for a given kind
  function findCbRange(lineIdx, kind) {
    return asyncCallbackRanges.find(
      (r) => r.startLine === lineIdx && r.kind === kind
    ) || null;
  }

  // Extract the delay argument from setTimeout/setInterval, checking the
  // current line first, then falling back to the closing brace line for
  // multi-line callbacks (e.g. `}, 2000);`).
  function extractTimerDelay(trimmedLine, lineIdx, fallback) {
    const inlineMatch = trimmedLine.match(/,\s*(\d+)\s*\)?\s*;?\s*$/);
    if (inlineMatch) return inlineMatch[1];
    const range = findBraceBody(lineIdx);
    if (range && range.endLine > lineIdx) {
      const closingLine = lines[range.endLine].trim();
      const closingMatch = closingLine.match(/},?\s*(\d+)\s*\)/);
      if (closingMatch) return closingMatch[1];
    }
    return fallback;
  }

  // ── Phase 3: step generation helpers ──────────────────────────────────

  function addStep(type, data, line) {
    const step = {
      id: nextId(),
      type,
      line,
      ...data,
    };
    steps.push(step);
  }

  let promiseCounter = 0;

  // Walk top-level lines
  function walkLines(lineRange, scopeName) {
    for (let idx = lineRange.start; idx <= lineRange.end; idx++) {
      const trimmed = lines[idx].trim();

      if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*')) continue;

      // Skip function/callback bodies at top level
      if (scopeName === 'Global' && shouldSkipLine(idx)) {
        continue;
      }

      processLine(trimmed, idx + 1, scopeName);
    }
  }

  function processLine(trimmed, lineNum, scopeName) {
    // Strip string contents for keyword detection to avoid false positives
    // (e.g. console.log("queueMicrotask") should not be treated as a queueMicrotask call)
    const stripped = stripCommentsAndStrings(trimmed);

    // Skip lines that are just closing braces, semicolons, or bracket fragments
    if (/^[}\]);,]+$/.test(trimmed)) return;

    // Skip `for` / `while` / `if` / `else` control-flow lines — they are
    // structural and we don't simulate loop iterations.
    if (/^(for|while|if|else|switch|case|break|continue|try|catch|finally)\b/.test(trimmed)) {
      return;
    }

    // Skip function definition lines (the header like `function foo() {`)
    if (/^(async\s+)?function[\s*]/.test(trimmed)) {
      return;
    }

    // Variable declarations (not function defs / arrows)
    const varMatch = trimmed.match(
      /(?:const|let|var)\s+(\w+)\s*=\s*(.+?)(?:;?\s*$)/
    );
    if (varMatch && !trimmed.includes('function') && !trimmed.includes('=>')) {
      // Check if RHS is a function call we know about
      const rhsCallMatch = varMatch[2].match(/^(\w+)\s*\(/);
      if (rhsCallMatch && funcDefs[rhsCallMatch[1]]) {
        simulateFuncCall(rhsCallMatch[1], lineNum);
        addStep(
          'scope_update',
          {
            name: varMatch[1],
            value: `<result of ${rhsCallMatch[1]}()>`,
            scope: scopeName,
            detail: `Declare ${varMatch[1]}`,
          },
          lineNum
        );
      } else {
        addStep(
          'scope_update',
          {
            name: varMatch[1],
            value: varMatch[2].replace(/;$/, ''),
            scope: scopeName,
            detail: `Declare ${varMatch[1]}`,
          },
          lineNum
        );
      }
      return;
    }

    // console.log / warn / error
    const consoleMatch = trimmed.match(/console\.(log|warn|error)\s*\((.+)\)/);
    if (consoleMatch) {
      addStep(
        'console',
        {
          level: consoleMatch[1],
          text: consoleMatch[2],
          detail: `console.${consoleMatch[1]}(${consoleMatch[2]})`,
        },
        lineNum
      );
      return;
    }

    // setTimeout
    if (stripped.includes('setTimeout')) {
      const delay = extractTimerDelay(trimmed, lineNum - 1, '0');
      const cbRange = findCbRange(lineNum - 1, 'macrotask');
      addStep(
        'webapi_add',
        {
          apiType: 'setTimeout',
          delay: parseInt(delay),
          detail: `setTimeout registered (${delay}ms)`,
          apiId: nextId(),
        },
        lineNum
      );
      addStep(
        'macrotask_add',
        {
          name: `setTimeout callback (${delay}ms)`,
          detail: `Timer done → callback queued as macrotask`,
          sourceDelay: parseInt(delay),
          _callbackRange: cbRange,
        },
        lineNum
      );
      return;
    }

    // setInterval
    if (stripped.includes('setInterval')) {
      const delay = extractTimerDelay(trimmed, lineNum - 1, '1000');
      const cbRange = findCbRange(lineNum - 1, 'macrotask');
      addStep(
        'webapi_add',
        {
          apiType: 'setInterval',
          delay: parseInt(delay),
          detail: `setInterval registered (${delay}ms)`,
          apiId: nextId(),
        },
        lineNum
      );
      addStep(
        'macrotask_add',
        {
          name: `setInterval tick (${delay}ms)`,
          detail: `First interval tick → callback queued as macrotask`,
          sourceDelay: parseInt(delay),
          _callbackRange: cbRange,
        },
        lineNum
      );
      return;
    }

    // queueMicrotask
    if (stripped.includes('queueMicrotask')) {
      const cbRange = findCbRange(lineNum - 1, 'microtask');
      addStep(
        'microtask_add',
        {
          name: 'queueMicrotask()',
          detail: 'queueMicrotask() → queued as microtask',
          content: 'queueMicrotask()',
          _callbackRange: cbRange,
        },
        lineNum
      );
      return;
    }

    // Promise.resolve().then() or new Promise
    if (
      stripped.includes('Promise.resolve') ||
      stripped.includes('new Promise')
    ) {
      promiseCounter++;
      addStep(
        'scope_update',
        {
          name: `Promise#${promiseCounter}`,
          value: 'pending',
          scope: 'Global',
          detail: `Promise #${promiseCounter} created (pending)`,
        },
        lineNum
      );
    }

    // .then callback
    if (stripped.includes('.then(') || stripped.includes('.then (')) {
      const thenContent = trimmed.match(/\.then\s*\(\s*(.+?)\s*(?:\)|$)/);
      const cbRange = findCbRange(lineNum - 1, 'microtask');
      addStep(
        'microtask_add',
        {
          name: `.then() callback`,
          detail: `Promise resolved → .then() queued as microtask`,
          content: thenContent ? thenContent[1].slice(0, 40) : '.then()',
          _callbackRange: cbRange,
        },
        lineNum
      );
      return;
    }

    // await — signal caller to defer remaining lines
    if (stripped.includes('await ')) {
      addStep(
        'microtask_add',
        {
          name: 'await resume',
          detail: 'Awaited promise resolved → resume as microtask',
          content: trimmed.slice(0, 40),
        },
        lineNum
      );
      return 'await';
    }

    // IIFE: (function() { ... })() or (async function() { ... })()
    if (/^\(\s*(async\s+)?function/.test(trimmed)) {
      const iifeKey = Object.keys(funcDefs).find(
        (k) => funcDefs[k].isIIFE && funcDefs[k].startLine === lineNum - 1
      );
      if (iifeKey) {
        simulateFuncCall(iifeKey, lineNum);
      }
      return;
    }

    // Function calls — bare calls like `foo()` or `foo(arg)`
    // (Assignment-based calls are handled above in varMatch.)
    const callMatch = trimmed.match(/^(\w+)\s*\(/);
    if (
      callMatch &&
      !trimmed.startsWith('console') &&
      !trimmed.startsWith('setTimeout') &&
      !trimmed.startsWith('setInterval') &&
      !trimmed.startsWith('queueMicrotask')
    ) {
      const funcName = callMatch[1];
      simulateFuncCall(funcName, lineNum);
      return;
    }

    // return statement — no step needed; function/callback lifecycle handles pops
    if (trimmed.startsWith('return ') || trimmed === 'return;' || trimmed === 'return') {
      return;
    }
  }

  function simulateFuncCall(funcName, callLineNum) {
    const def = funcDefs[funcName];
    const displayName = def?.displayName || funcName;

    addStep(
      'callstack_push',
      {
        name: `${displayName}()`,
        detail: `Call ${displayName}`,
        funcLine: def?.startLine != null
          ? def.startLine + 1
          : undefined,
      },
      callLineNum
    );

    if (def) {
      scopeStack.push({ name: displayName, variables: {} });
      addStep(
        'scope_push',
        {
          name: displayName,
          detail: `Enter ${displayName} scope`,
        },
        def.startLine + 1
      );

      if (def.endLine > def.startLine) {
        for (let i = def.startLine + 1; i < def.endLine; i++) {
          const trimmed = lines[i].trim();
          if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*')) continue;

          if (isInsideNestedFunc(i, def)) {
            continue;
          }

          if (isInsideAsyncCallback(i) && !isCallbackStartLine(i)) {
            continue;
          }

          const result = processLine(trimmed, i + 1, displayName);
          if (result === 'await' && def.isAsync) {
            const lastStep = steps[steps.length - 1];
            if (lastStep.type === 'microtask_add') {
              lastStep._callbackRange = {
                startLine: i,
                endLine: def.endLine,
                kind: 'microtask',
              };
            }
            break;
          }
        }
      }

      scopeStack.pop();
    }

    addStep(
      'callstack_pop',
      {
        name: `${displayName}()`,
        detail: `${displayName} returns`,
      },
      callLineNum
    );
  }

  // Check if lineIdx is the opening line of an async callback range
  function isCallbackStartLine(lineIdx) {
    return asyncCallbackRanges.some((r) => r.startLine === lineIdx);
  }

  // Check if lineIdx is inside a nested function (not parentDef itself)
  function isInsideNestedFunc(lineIdx, parentDef) {
    for (const def of Object.values(funcDefs)) {
      if (def === parentDef) continue;
      if (
        def.startLine > parentDef.startLine &&
        def.endLine <= parentDef.endLine &&
        lineIdx > def.startLine &&
        lineIdx <= def.endLine
      ) {
        return true;
      }
    }
    return false;
  }

  // ── Phase 4: walk top-level code ──────────────────────────────────────

  addStep('callstack_push', { name: 'Global Execution Context', detail: 'Program starts' }, 1);

  walkLines({ start: 0, end: lines.length - 1 }, 'Global');

  addStep('callstack_pop', { name: 'Global Execution Context', detail: 'Synchronous code finished' }, lines.length);

  // ── Phase 5: process async queues ─────────────────────────────────────

  function replayCallback(cbInfo) {
    if (!cbInfo) {
      return;
    }

    if (cbInfo.inlineExpr) {
      processLine(cbInfo.inlineExpr, cbInfo.startLine + 1, 'callback');
    } else if (cbInfo.endLine > cbInfo.startLine) {
      for (let i = cbInfo.startLine + 1; i < cbInfo.endLine; i++) {
        const trimmed = lines[i].trim();
        if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*')) continue;

        // Skip lines inside nested async callbacks within this callback
        // (they'll be replayed when that inner task fires)
        if (isInsideNestedAsyncCallback(i, cbInfo)) {
          continue;
        }

        const result = processLine(trimmed, i + 1, 'callback');
        if (result === 'await') {
          const lastStep = steps[steps.length - 1];
          if (lastStep.type === 'microtask_add') {
            lastStep._callbackRange = {
              startLine: i,
              endLine: cbInfo.endLine,
              kind: 'microtask',
            };
          }
          break;
        }
      }
    }
  }

  // Check if lineIdx is inside a deeper async callback that is nested within parentCb
  function isInsideNestedAsyncCallback(lineIdx, parentCb) {
    return asyncCallbackRanges.some(
      (r) =>
        r !== parentCb &&
        r.startLine > parentCb.startLine &&
        r.endLine <= parentCb.endLine &&
        lineIdx > r.startLine &&
        lineIdx <= r.endLine
    );
  }

  const processedMicro = new Set();
  const processedMacro = new Set();

  function drainMicrotasks() {
    const pending = steps.filter(
      (s) => s.type === 'microtask_add' && !processedMicro.has(s.id)
    );
    if (pending.length === 0) return;

    addStep(
      'event_loop_tick',
      { detail: 'Call stack empty → Event loop checks microtask queue' },
      0
    );

    pending.forEach((mt) => {
      processedMicro.add(mt.id);
      addStep(
        'microtask_run',
        {
          name: mt.name,
          detail: `Running microtask: ${mt.name}`,
        },
        mt.line
      );
      replayCallback(mt._callbackRange);
    });

    drainMicrotasks();
  }

  function drainMacrotasks() {
    const pending = steps.filter(
      (s) => s.type === 'macrotask_add' && !processedMacro.has(s.id)
    );
    if (pending.length === 0) return;

    pending.forEach((mt) => {
      processedMacro.add(mt.id);
      addStep(
        'event_loop_tick',
        { detail: 'Microtask queue empty → Event loop picks next macrotask' },
        0
      );
      addStep(
        'macrotask_run',
        {
          name: mt.name,
          detail: `Running macrotask: ${mt.name}`,
        },
        mt.line
      );
      replayCallback(mt._callbackRange);

      drainMicrotasks();
    });

    drainMacrotasks();
  }

  drainMicrotasks();
  drainMacrotasks();

  // Clean internal metadata from steps before returning
  const finalSteps = steps.map(({ _callbackRange, ...rest }) => rest);

  return finalSteps;
}
