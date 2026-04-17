import { Group, Panel, Separator } from 'react-resizable-panels';
import Navbar from './components/Navbar/Navbar';
import CodeEditor from './components/Editor/CodeEditor';
import CallStack from './components/Visualizer/CallStack';
import WebAPIsBox from './components/Visualizer/WebAPIsBox';
import EventLoopIndicator from './components/Visualizer/EventLoopIndicator';
import MicrotaskQueue from './components/Visualizer/MicrotaskQueue';
import MacrotaskQueue from './components/Visualizer/MacrotaskQueue';
import ConceptDetector from './components/Intel/ConceptDetector';
import ScopeInspector from './components/Intel/ScopeInspector';
import OutputConsole from './components/Intel/OutputConsole';

function ResizeHandle() {
  return (
    <Separator className="w-[3px] hover:w-[3px] transition-colors" />
  );
}

export default function App() {
  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden">
      <Navbar />
      <div className="flex-1 min-h-0 p-1.5 gap-1.5">
        <Group direction="horizontal" className="h-full">
          {/* Panel 1 — Editor */}
          <Panel defaultSize={38} minSize={20}>
            <CodeEditor />
          </Panel>

          <ResizeHandle />

          {/* Panel 2 — Visualizer */}
          <Panel defaultSize={37} minSize={25}>
            <div
              className="glass-panel h-full flex flex-col overflow-hidden"
              style={{ borderTop: '2px solid var(--accent-blue)' }}
            >
              <div className="flex items-center px-3 py-1.5 border-b border-[var(--border-subtle)]">
                <span className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider font-medium">
                  Runtime Visualizer
                </span>
              </div>
              <div className="flex-1 overflow-y-auto flex flex-col">
                {/* Call Stack — top 40% */}
                <div className="flex-[4] min-h-0 overflow-hidden">
                  <CallStack />
                </div>

                {/* Web APIs — 15% */}
                <div className="flex-[1.5] min-h-0 border-t border-[var(--border-subtle)] overflow-hidden">
                  <WebAPIsBox />
                </div>

                {/* Event Loop */}
                <div className="border-t border-[var(--border-subtle)]">
                  <EventLoopIndicator />
                </div>

                {/* Microtask Queue — 15% */}
                <div className="border-t border-[var(--border-subtle)]">
                  <MicrotaskQueue />
                </div>

                {/* Macrotask Queue — 15% */}
                <div className="border-t border-[var(--border-subtle)]">
                  <MacrotaskQueue />
                </div>
              </div>
            </div>
          </Panel>

          <ResizeHandle />

          {/* Panel 3 — Intel */}
          <Panel defaultSize={25} minSize={18}>
            <div
              className="glass-panel h-full flex flex-col overflow-hidden"
              style={{ borderTop: '2px solid var(--accent-purple)' }}
            >
              <div className="flex items-center px-3 py-1.5 border-b border-[var(--border-subtle)]">
                <span className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider font-medium">
                  Code Intelligence
                </span>
              </div>
              <div className="flex-1 overflow-y-auto flex flex-col">
                {/* Concept Detector — top third */}
                <div className="border-b border-[var(--border-subtle)]">
                  <ConceptDetector />
                </div>

                {/* Scope Inspector — middle third */}
                <div className="border-b border-[var(--border-subtle)]">
                  <ScopeInspector />
                </div>

                {/* Output Console — bottom third */}
                <div className="flex-1 min-h-[120px]">
                  <OutputConsole />
                </div>
              </div>
            </div>
          </Panel>
        </Group>
      </div>

      <a
        href="https://github.com/rachanpadmanabha/js-lens/issues"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-2 right-3 p-1.5 rounded-md text-[var(--text-muted)] hover:text-accent-indigo hover:bg-[var(--bg-hover)] transition-colors opacity-50 hover:opacity-100"
        title="Report a Bug or Request a Feature"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </a>
    </div>
  );
}
