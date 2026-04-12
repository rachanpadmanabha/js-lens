import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useExecutionStore from '../../store/useExecutionStore';

const levelStyles = {
  log: '',
  warn: 'bg-accent-amber/5 border-l-2 border-accent-amber/30',
  error: 'bg-red-500/5 border-l-2 border-red-500/30',
};

const levelTextColors = {
  log: 'text-[var(--text-code)]',
  warn: 'text-accent-amber',
  error: 'text-red-400',
};

export default function OutputConsole() {
  const consoleOutput = useExecutionStore((s) => s.consoleOutput);
  const clearConsole = useExecutionStore((s) => s.clearConsole);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [consoleOutput]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-[var(--border-subtle)]">
        <span className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider font-medium">
          Console
        </span>
        {consoleOutput.length > 0 && (
          <button
            onClick={clearConsole}
            className="text-[10px] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors px-1.5 py-0.5 rounded hover:bg-[var(--bg-hover)]"
          >
            Clear
          </button>
        )}
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-1 font-mono text-[12px]">
        <AnimatePresence>
          {consoleOutput.map((entry) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              className={`flex items-start gap-2 px-2 py-1 rounded ${levelStyles[entry.level] || ''}`}
            >
              <span className="text-[10px] text-[var(--text-muted)] flex-shrink-0 mt-px">
                {new Date(entry.timestamp).toLocaleTimeString('en', {
                  hour12: false,
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </span>
              <span className={`${levelTextColors[entry.level] || levelTextColors.log} break-all`}>
                {entry.text}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
        {consoleOutput.length === 0 && (
          <div className="text-[11px] text-[var(--text-muted)] py-2 opacity-50 text-center">
            Console output appears here
          </div>
        )}
      </div>
    </div>
  );
}
