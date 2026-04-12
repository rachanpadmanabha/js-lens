import { motion, AnimatePresence } from 'framer-motion';
import useExecutionStore from '../../store/useExecutionStore';

export default function MicrotaskQueue() {
  const microtaskQueue = useExecutionStore((s) => s.microtaskQueue);

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-[var(--border-subtle)]">
        <div className="w-2 h-2 rounded-full bg-accent-purple" />
        <span className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider font-medium">
          Microtask Queue
        </span>
        <span
          className="text-[9px] text-[var(--text-muted)] opacity-60 ml-1"
          title="Runs before next macrotask"
        >
          (runs first)
        </span>
        {microtaskQueue.length > 0 && (
          <span className="text-[10px] text-accent-purple bg-accent-purple/10 px-1.5 py-0.5 rounded-full ml-auto">
            {microtaskQueue.length}
          </span>
        )}
      </div>
      <div className="queue-scroll overflow-x-auto px-3 py-2 flex gap-1.5">
        <AnimatePresence mode="popLayout">
          {microtaskQueue.map((task, i) => (
            <motion.div
              key={task.id || `micro-${i}`}
              initial={{ x: 48, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -36, opacity: 0, scale: 0.88 }}
              transition={{ type: 'spring', stiffness: 360, damping: 30 }}
              layout
              className="queue-item glow-purple card-hover px-3 py-2 flex-shrink-0 min-w-[130px]"
            >
              <div className="text-[11px] font-medium text-accent-purple truncate">{task.name}</div>
              {task.detail && (
                <div className="text-[10px] text-[var(--text-muted)] truncate mt-0.5">{task.detail}</div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        {microtaskQueue.length === 0 && (
          <div className="text-[11px] text-[var(--text-muted)] py-1 opacity-50">Empty</div>
        )}
      </div>
    </div>
  );
}
