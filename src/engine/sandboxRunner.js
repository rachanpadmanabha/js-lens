let sandboxIframe = null;
let runNonce = 0;

function getSandboxIframe() {
  if (sandboxIframe && document.body.contains(sandboxIframe)) {
    return sandboxIframe;
  }
  sandboxIframe = document.createElement('iframe');
  sandboxIframe.style.display = 'none';
  sandboxIframe.sandbox = 'allow-scripts';
  document.body.appendChild(sandboxIframe);
  return sandboxIframe;
}

export function runInSandbox(code, onConsole, onError) {
  // Increment nonce so stale messages from prior runs are ignored
  const thisNonce = ++runNonce;

  return new Promise((resolve) => {
    const iframe = getSandboxIframe();
    let settled = false;

    function cleanup() {
      if (settled) return;
      settled = true;
      window.removeEventListener('message', handler);
      clearTimeout(safetyId);
      resolve();
    }

    const handler = (event) => {
      if (event.source !== iframe.contentWindow) return;
      const { type, payload, nonce } = event.data || {};
      // Ignore messages from a prior run
      if (nonce !== thisNonce) {
        return;
      }
      if (type === 'console') {
        onConsole?.(payload);
      } else if (type === 'error') {
        onError?.(payload);
      } else if (type === 'done') {
        cleanup();
      }
    };

    window.addEventListener('message', handler);

    // Estimate a safe wait time based on max timer delay found in user code
    // Include both setTimeout and setInterval delays
    const timeoutDelays = [...code.matchAll(/setTimeout\s*\([^,]*,\s*(\d+)\s*\)/g)].map(m => Number(m[1]));
    const intervalDelays = [...code.matchAll(/setInterval\s*\([^,]*,\s*(\d+)\s*\)/g)].map(m => Number(m[1]));
    const allDelays = [...timeoutDelays, ...intervalDelays];
    const maxDelay = allDelays.length > 0 ? Math.max(...allDelays) : 0;
    const doneDelay = Math.min(maxDelay + 500, 4500);

    const safeCode = code.replace(/<\/(script)/gi, '<\\/$1');

    const wrappedCode = `
      <script>
        const _nonce = ${thisNonce};
        function _send(type, payload) {
          parent.postMessage({ type, payload, nonce: _nonce }, '*');
        }

        function _formatArgs(args) {
          return args.map(a => {
            if (a === null) return 'null';
            if (a === undefined) return 'undefined';
            if (typeof a === 'object') {
              try { return JSON.stringify(a); } catch { return String(a); }
            }
            return String(a);
          }).join(' ');
        }

        console.log = (...args) => {
          _send('console', { level: 'log', text: _formatArgs(args), timestamp: Date.now() });
        };
        console.warn = (...args) => {
          _send('console', { level: 'warn', text: _formatArgs(args), timestamp: Date.now() });
        };
        console.error = (...args) => {
          _send('console', { level: 'error', text: _formatArgs(args), timestamp: Date.now() });
        };

        window.onerror = (msg, src, line, col, err) => {
          _send('error', { message: msg, line, col });
        };

        window.onunhandledrejection = (e) => {
          _send('error', { message: 'Unhandled rejection: ' + (e.reason?.message || e.reason) });
        };

        try {
          (async () => {
            ${safeCode}
          })();
          setTimeout(() => _send('done', {}), ${doneDelay});
        } catch(e) {
          _send('error', { message: e.message, line: e.lineNumber });
          _send('done', {});
        }
      <\/script>
    `;

    iframe.srcdoc = wrappedCode;

    // Safety timeout — ensures we always resolve even if the iframe hangs
    const safetyId = setTimeout(() => {
      cleanup();
    }, 5000);
  });
}
