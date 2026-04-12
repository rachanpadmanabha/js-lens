import { motion, AnimatePresence } from 'framer-motion';
import useExecutionStore from '../../store/useExecutionStore';

export default function CallStack() {
  const callStack = useExecutionStore((s) => s.callStack);

  const displayStack = [...callStack].reverse();
  const hasGlobal = callStack.some((f) => f.name === 'Global Execution Context');

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-[var(--border-subtle)]">
        <div className="w-2 h-2 rounded-full bg-accent-blue" />
        <span className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider font-medium">
          Call Stack
        </span>
        {callStack.length > 0 && (
          <span className="text-[10px] text-[var(--text-muted)] bg-[var(--bg-hover)] px-1.5 py-0.5 rounded-full ml-auto">
            {callStack.length}
          </span>
        )}
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-1.5">
        <AnimatePresence mode="popLayout">
          {displayStack.map((frame, i) => (
            <motion.div
              key={frame.id || `frame-${i}`}
              initial={{ y: -28, opacity: 0, scale: 0.93 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -20, opacity: 0, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 420, damping: 28 }}
              layout
              className="glass-panel glow-blue card-hover px-3 py-2 transition-all duration-150"
            >
              <div className="text-[12px] font-medium text-[var(--text-primary)]">
                {frame.name}
              </div>
              {frame.line > 0 && (
                <div className="text-[11px] text-[var(--text-muted)]">line {frame.line}</div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {!hasGlobal && callStack.length === 0 && (
          <div className="glass-panel px-3 py-2 opacity-40">
            <div className="text-[12px] text-[var(--text-muted)]">
              Global Execution Context
            </div>
            <div className="text-[11px] text-[var(--text-muted)]">idle</div>
          </div>
        )}
      </div>
    </div>
  );
}
