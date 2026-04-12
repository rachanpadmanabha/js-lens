import { motion } from 'framer-motion';

const conceptDiagrams = {
  Closure: (
    <svg width="200" height="80" viewBox="0 0 200 80" className="mx-auto my-2">
      <rect x="5" y="5" width="90" height="70" rx="8" fill="none" stroke="#60a5fa" strokeWidth="1.5" strokeDasharray="4 2" />
      <text x="12" y="20" fill="#60a5fa" fontSize="9" fontFamily="Inter">outer()</text>
      <rect x="15" y="28" width="70" height="40" rx="6" fill="rgba(96,165,250,0.08)" stroke="#818cf8" strokeWidth="1" />
      <text x="22" y="43" fill="#818cf8" fontSize="9" fontFamily="Inter">inner()</text>
      <text x="22" y="58" fill="#6b6b80" fontSize="8" fontFamily="monospace">count = 0</text>
      <line x1="95" y1="48" x2="140" y2="48" stroke="#818cf8" strokeWidth="1" markerEnd="url(#arrow)" />
      <text x="110" y="42" fill="#6b6b80" fontSize="7" fontFamily="Inter">closes over</text>
      <rect x="140" y="30" width="55" height="36" rx="6" fill="rgba(129,140,248,0.08)" stroke="#a78bfa" strokeWidth="1" />
      <text x="147" y="48" fill="#a78bfa" fontSize="8" fontFamily="monospace">count</text>
      <text x="147" y="58" fill="#6b6b80" fontSize="7" fontFamily="Inter">remembered</text>
      <defs>
        <marker id="arrow" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#818cf8" />
        </marker>
      </defs>
    </svg>
  ),
  'Promise / Async': (
    <svg width="200" height="60" viewBox="0 0 200 60" className="mx-auto my-2">
      <rect x="5" y="15" width="50" height="30" rx="6" fill="rgba(167,139,250,0.1)" stroke="#a78bfa" strokeWidth="1" />
      <text x="12" y="34" fill="#a78bfa" fontSize="8">pending</text>
      <line x1="55" y1="30" x2="80" y2="30" stroke="#a78bfa" strokeWidth="1" markerEnd="url(#arrowP)" />
      <rect x="80" y="15" width="50" height="30" rx="6" fill="rgba(52,211,153,0.1)" stroke="#34d399" strokeWidth="1" />
      <text x="86" y="34" fill="#34d399" fontSize="8">resolved</text>
      <line x1="130" y1="30" x2="155" y2="30" stroke="#34d399" strokeWidth="1" markerEnd="url(#arrowG)" />
      <rect x="155" y="15" width="40" height="30" rx="6" fill="rgba(129,140,248,0.1)" stroke="#818cf8" strokeWidth="1" />
      <text x="160" y="34" fill="#818cf8" fontSize="8">.then()</text>
      <defs>
        <marker id="arrowP" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#a78bfa" />
        </marker>
        <marker id="arrowG" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#34d399" />
        </marker>
      </defs>
    </svg>
  ),
};

export default function ExplainerDrawer({ concept, onClose }) {
  if (!concept) return null;

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="glass-panel border-t border-[var(--border-subtle)] p-3 mx-1 mb-1 rounded-xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-[14px]">{concept.icon}</span>
          <span className="text-[13px] font-medium text-[var(--text-primary)]">{concept.name}</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md hover:bg-[var(--bg-hover)] text-[var(--text-muted)] transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* TL;DR */}
      <p className="text-[11px] text-[var(--text-primary)] leading-relaxed mb-2">
        {concept.description}
      </p>

      {/* Diagram */}
      {conceptDiagrams[concept.name] && (
        <div className="bg-[var(--bg-base)] rounded-lg p-2 mb-2">
          {conceptDiagrams[concept.name]}
        </div>
      )}

      {/* Detail */}
      <p className="text-[10px] text-[var(--text-muted)] leading-relaxed">
        {concept.detail}
      </p>
    </motion.div>
  );
}
