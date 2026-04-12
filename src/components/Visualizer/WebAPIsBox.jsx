import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useExecutionStore from '../../store/useExecutionStore';

function WebAPIEntry({ api }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Date.now() - api.startTime);
    }, 100);
    return () => clearInterval(interval);
  }, [api.startTime]);

  const remaining = Math.max(0, (api.delay || 0) - elapsed);
  const icon = api.type === 'setTimeout' ? '⏱' : api.type === 'setInterval' ? '🔁' : api.type === 'fetch' ? '🌐' : '📡';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="glass-panel glow-pink card-hover px-3 py-1.5 flex items-center gap-2"
    >
      <span className="text-[13px]">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] text-[var(--text-primary)] truncate">{api.type}</div>
        <div className="text-[10px] text-[var(--text-muted)]">
          {remaining > 0 ? `${Math.ceil(remaining)}ms remaining` : 'ready'}
        </div>
      </div>
    </motion.div>
  );
}

export default function WebAPIsBox() {
  const webAPIs = useExecutionStore((s) => s.webAPIs);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-[var(--border-subtle)]">
        <div className="w-2 h-2 rounded-full bg-accent-pink" />
        <span className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider font-medium">
          Web APIs
        </span>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-1">
        <AnimatePresence>
          {webAPIs.map((api) => (
            <WebAPIEntry key={api.id} api={api} />
          ))}
        </AnimatePresence>
        {webAPIs.length === 0 && (
          <div className="text-[11px] text-[var(--text-muted)] text-center py-2 opacity-50">
            No active Web APIs
          </div>
        )}
      </div>
    </div>
  );
}
