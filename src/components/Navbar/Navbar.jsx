import { useState } from 'react';
import { motion } from 'framer-motion';
import useEditorStore from '../../store/useEditorStore';
import useExecutionStore from '../../store/useExecutionStore';
import { runAllSteps, resetSteps, prepareSteps } from '../../engine/stepRunner';

export default function Navbar() {
  const { stepMode, toggleStepMode, isRunning, setIsRunning, code, reset, speed, setSpeed } =
    useEditorStore();
  const { resetExecution } = useExecutionStore();
  const [resetSpinning, setResetSpinning] = useState(false);

  const handleRun = () => {
    if (isRunning) return;
    resetExecution();
    if (stepMode) {
      prepareSteps(code);
    } else {
      runAllSteps(code);
    }
  };

  const handleReset = () => {
    setResetSpinning(true);
    setIsRunning(false);
    resetSteps();
    reset();
    setTimeout(() => setResetSpinning(false), 300);
  };

  return (
    <nav className="h-10 flex items-center justify-between px-4 border-b border-border-subtle bg-surface/80 backdrop-blur-sm flex-shrink-0">
      {/* Left — Wordmark */}
      <div className="flex items-center gap-2">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-accent-indigo">
          <path
            d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
            fill="currentColor"
            opacity="0.9"
          />
        </svg>
        <span className="text-[15px] font-medium text-accent-indigo tracking-tight">
          JS Lens
        </span>
      </div>

      {/* Right — Controls */}
      <div className="flex items-center gap-2">
        {/* Step Mode Toggle */}
        <label className="flex items-center gap-1.5 cursor-pointer select-none">
          <span className="text-[11px] text-[var(--text-muted)]">Step</span>
          <button
            onClick={toggleStepMode}
            className={`relative w-8 h-[18px] rounded-full transition-colors duration-200 ${
              stepMode ? 'bg-accent-amber' : 'bg-[var(--bg-hover)]'
            }`}
          >
            <motion.div
              className="absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white"
              animate={{ left: stepMode ? 14 : 2 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          </button>
        </label>

        {/* Speed Slider */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--text-muted)] flex-shrink-0">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <input
            type="range"
            min={1}
            max={5}
            step={1}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="w-16 h-1 appearance-none bg-[var(--bg-hover)] rounded-full cursor-pointer accent-accent-indigo [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent-indigo [&::-webkit-slider-thumb]:shadow-[0_0_6px_rgba(129,140,248,0.4)]"
            title={`Speed: ${['0.5x', '1x', '2x', '3x', '5x'][speed - 1]}`}
          />
          <span className="text-[10px] text-[var(--text-muted)] w-6 text-right font-mono">
            {['0.5x', '1x', '2x', '3x', '5x'][speed - 1]}
          </span>
        </div>

        {/* Reset */}
        <button
          onClick={handleReset}
          className={`p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors btn-press ${
            resetSpinning ? 'reset-spin' : ''
          }`}
          title="Reset"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
        </button>

        {/* Run */}
        <button
          onClick={handleRun}
          disabled={isRunning}
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-accent-indigo text-white text-[12px] font-medium hover:brightness-110 transition-all btn-press disabled:opacity-60"
        >
          {isRunning ? (
            <motion.svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
            >
              <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="12" />
            </motion.svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5,3 19,12 5,21" />
            </svg>
          )}
          {isRunning ? 'Running' : 'Run'}
        </button>
      </div>
    </nav>
  );
}
