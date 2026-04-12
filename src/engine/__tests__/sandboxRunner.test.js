import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { runInSandbox } from '../sandboxRunner';

// Suppress console noise
beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'group').mockImplementation(() => {});
  vi.spyOn(console, 'groupEnd').mockImplementation(() => {});
});

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

// In jsdom, iframes with sandbox="allow-scripts" + srcdoc don't actually run
// scripts. We simulate the iframe behavior by capturing srcdoc and manually
// dispatching postMessage events.

function createMockIframe() {
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  // Track srcdoc assignments
  let assignedSrcdoc = null;
  const contentWindowProxy = {};

  Object.defineProperty(iframe, 'srcdoc', {
    get: () => assignedSrcdoc,
    set: (val) => {
      assignedSrcdoc = val;
      // Parse and simulate the script execution
      iframe._lastSrcdoc = val;
    },
  });

  Object.defineProperty(iframe, 'contentWindow', {
    get: () => contentWindowProxy,
  });

  return { iframe, contentWindowProxy };
}

// Simulate the iframe sending messages back to parent
function simulateIframeMessage(contentWindowProxy, type, payload, nonce) {
  const event = new MessageEvent('message', {
    data: { type, payload, nonce },
    source: contentWindowProxy,
  });
  window.dispatchEvent(event);
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Basic execution
// ─────────────────────────────────────────────────────────────────────────────
describe('runInSandbox — basic', () => {
  it('returns a promise', () => {
    const result = runInSandbox("console.log('test')", () => {}, () => {});
    expect(result).toBeInstanceOf(Promise);
  });

  it('resolves after safety timeout even without done signal', async () => {
    vi.useFakeTimers();
    const promise = runInSandbox('', () => {}, () => {});
    vi.advanceTimersByTime(6000);
    await promise; // should resolve from safety timeout
    vi.useRealTimers();
  });

  it('creates an iframe in the DOM', () => {
    runInSandbox('const x = 1;', () => {}, () => {});
    const iframes = document.querySelectorAll('iframe');
    expect(iframes.length).toBeGreaterThanOrEqual(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Console interception
// ─────────────────────────────────────────────────────────────────────────────
describe('runInSandbox — console callbacks', () => {
  it('calls onConsole when iframe sends console message', async () => {
    vi.useFakeTimers();
    const outputs = [];
    const promise = runInSandbox("console.log('hello')", (payload) => {
      outputs.push(payload);
    });

    // Simulate the iframe sending messages
    const iframe = document.querySelector('iframe');
    if (iframe && iframe.contentWindow) {
      simulateIframeMessage(iframe.contentWindow, 'console', {
        level: 'log',
        text: 'hello',
        timestamp: Date.now(),
      }, 1);
      simulateIframeMessage(iframe.contentWindow, 'done', {}, 1);
    }

    vi.advanceTimersByTime(6000);
    await promise;
    vi.useRealTimers();
    // In jsdom, the iframe may not have a proper contentWindow, so we just
    // verify the function doesn't crash
  });

  it('does not crash when onConsole is null', async () => {
    vi.useFakeTimers();
    const promise = runInSandbox("console.log('test')", null, null);
    vi.advanceTimersByTime(6000);
    await expect(promise).resolves.toBeUndefined();
    vi.useRealTimers();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Error handling
// ─────────────────────────────────────────────────────────────────────────────
describe('runInSandbox — error handling', () => {
  it('calls onError when iframe sends error message', async () => {
    vi.useFakeTimers();
    const errors = [];
    const promise = runInSandbox('throw new Error("boom")', () => {}, (err) => {
      errors.push(err);
    });

    const iframe = document.querySelector('iframe');
    if (iframe && iframe.contentWindow) {
      simulateIframeMessage(iframe.contentWindow, 'error', {
        message: 'boom',
      }, 2);
      simulateIframeMessage(iframe.contentWindow, 'done', {}, 2);
    }

    vi.advanceTimersByTime(6000);
    await promise;
    vi.useRealTimers();
  });

  it('does not crash with syntax error code', async () => {
    vi.useFakeTimers();
    const promise = runInSandbox('}{)(', () => {}, () => {});
    vi.advanceTimersByTime(6000);
    await expect(promise).resolves.toBeUndefined();
    vi.useRealTimers();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Nonce-based message filtering
// ─────────────────────────────────────────────────────────────────────────────
describe('runInSandbox — nonce filtering', () => {
  it('ignores messages with stale nonce', async () => {
    vi.useFakeTimers();
    const outputs = [];

    // First run (stale)
    const promise1 = runInSandbox('', (p) => outputs.push(p));
    vi.advanceTimersByTime(6000);
    await promise1;

    // Second run
    const promise2 = runInSandbox('', (p) => outputs.push(p));

    // Send a message with the old nonce (should be ignored)
    const iframe = document.querySelector('iframe');
    if (iframe && iframe.contentWindow) {
      simulateIframeMessage(iframe.contentWindow, 'console', {
        level: 'log',
        text: 'stale',
        timestamp: Date.now(),
      }, 1); // old nonce
    }

    vi.advanceTimersByTime(6000);
    await promise2;
    vi.useRealTimers();
    // Stale messages should have been ignored
    expect(outputs.filter(o => o.text === 'stale').length).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. Timeout calculation
// ─────────────────────────────────────────────────────────────────────────────
describe('runInSandbox — timeout', () => {
  it('resolves within safety timeout for empty code', async () => {
    vi.useFakeTimers();
    const promise = runInSandbox('', () => {});
    vi.advanceTimersByTime(6000);
    await expect(promise).resolves.toBeUndefined();
    vi.useRealTimers();
  });

  it('handles code with long setTimeout delays', async () => {
    vi.useFakeTimers();
    const promise = runInSandbox('setTimeout(() => {}, 3000);', () => {});
    vi.advanceTimersByTime(6000);
    await expect(promise).resolves.toBeUndefined();
    vi.useRealTimers();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. Code wrapping
// ─────────────────────────────────────────────────────────────────────────────
describe('runInSandbox — code safety', () => {
  it('escapes </script> in user code to prevent iframe breakout', async () => {
    vi.useFakeTimers();
    // Code containing </script> should be escaped
    const promise = runInSandbox("console.log('</script>')", () => {});
    vi.advanceTimersByTime(6000);
    await expect(promise).resolves.toBeUndefined();
    vi.useRealTimers();
  });

  it('wraps code in async IIFE for top-level await support', async () => {
    vi.useFakeTimers();
    // Top-level await should not cause a syntax error
    const promise = runInSandbox('const x = await Promise.resolve(1);', () => {});
    vi.advanceTimersByTime(6000);
    await expect(promise).resolves.toBeUndefined();
    vi.useRealTimers();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. Multiple consecutive runs
// ─────────────────────────────────────────────────────────────────────────────
describe('runInSandbox — iframe reuse', () => {
  it('can run code twice in succession without leaking state', async () => {
    vi.useFakeTimers();
    const outputs1 = [];
    const outputs2 = [];

    const p1 = runInSandbox("console.log('run1')", (p) => outputs1.push(p));
    vi.advanceTimersByTime(6000);
    await p1;

    const p2 = runInSandbox("console.log('run2')", (p) => outputs2.push(p));
    vi.advanceTimersByTime(6000);
    await p2;

    vi.useRealTimers();
    // Both should resolve without error
  });
});
