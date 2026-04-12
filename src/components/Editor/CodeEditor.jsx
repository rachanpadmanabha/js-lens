import { useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import useEditorStore, { PRESETS } from '../../store/useEditorStore';
import useExecutionStore from '../../store/useExecutionStore';
import { resetSteps } from '../../engine/stepRunner';
import EditorToolbar from './EditorToolbar';

export default function CodeEditor() {
  const { code, setCode, stepMode, preset, setPreset } = useEditorStore();
  const highlightLine = useExecutionStore((s) => s.highlightLine);
  const stepTooltip = useExecutionStore((s) => s.stepTooltip);
  const resetExecution = useExecutionStore((s) => s.resetExecution);
  const editorRef = useRef(null);
  const decorationsRef = useRef([]);

  const handleEditorMount = (editor) => {
    editorRef.current = editor;
  };

  useEffect(() => {
    if (!editorRef.current) return;
    const editor = editorRef.current;

    if (highlightLine && highlightLine > 0) {
      decorationsRef.current = editor.deltaDecorations(decorationsRef.current, [
        {
          range: {
            startLineNumber: highlightLine,
            startColumn: 1,
            endLineNumber: highlightLine,
            endColumn: 1,
          },
          options: {
            isWholeLine: true,
            className: stepMode ? 'current-line-pulse' : 'current-line-highlight',
            glyphMarginClassName: '',
          },
        },
      ]);
      editor.revealLineInCenter(highlightLine);
    } else {
      decorationsRef.current = editor.deltaDecorations(decorationsRef.current, []);
    }
  }, [highlightLine, stepMode]);

  return (
    <div className="flex flex-col h-full glass-panel overflow-hidden" style={{ borderTop: '2px solid var(--accent-indigo)' }}>
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-[var(--border-subtle)]">
        <span className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider font-medium">
          Editor
        </span>
        <div className="flex items-center gap-1.5">
          <label className="text-[10px] text-[var(--text-muted)]">Examples</label>
          <select
            value={preset}
            onChange={(e) => {
              setPreset(e.target.value);
              resetExecution();
              resetSteps();
            }}
            className="px-2 py-0.5 text-[11px] text-[var(--text-primary)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-md outline-none cursor-pointer hover:border-[var(--border-glow)] transition-colors"
          >
            {Object.keys(PRESETS).map((name) => (
              <option key={name} value={name} className="bg-[var(--bg-elevated)]">
                {name}
              </option>
            ))}
          </select>
        </div>
      </div>
      {stepMode && <EditorToolbar />}
      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          defaultLanguage="javascript"
          value={code}
          onChange={(val) => setCode(val || '')}
          onMount={handleEditorMount}
          theme="vs-dark"
          options={{
            fontSize: 13,
            fontFamily: "'JetBrains Mono', monospace",
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            lineNumbers: 'on',
            renderLineHighlight: 'line',
            padding: { top: 16 },
            overviewRulerLanes: 0,
            hideCursorInOverviewRuler: true,
            overviewRulerBorder: false,
            scrollbar: {
              verticalScrollbarSize: 4,
              horizontalScrollbarSize: 4,
            },
            contextmenu: false,
            automaticLayout: true,
          }}
        />
      </div>
      {stepMode && highlightLine && stepTooltip && (
        <div className="px-3 py-1.5 border-t border-[var(--border-subtle)] text-[11px] text-accent-indigo bg-accent-indigo/5">
          → {stepTooltip}
        </div>
      )}
    </div>
  );
}
