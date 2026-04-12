import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useEditorStore from '../../store/useEditorStore';
import { detectConcepts } from '../../engine/conceptDetector';
import ExplainerDrawer from './ExplainerDrawer';

const colorMap = {
  blue: { bg: 'bg-accent-blue/10', text: 'text-accent-blue', dot: 'bg-accent-blue' },
  purple: { bg: 'bg-accent-purple/10', text: 'text-accent-purple', dot: 'bg-accent-purple' },
  indigo: { bg: 'bg-accent-indigo/10', text: 'text-accent-indigo', dot: 'bg-accent-indigo' },
  pink: { bg: 'bg-accent-pink/10', text: 'text-accent-pink', dot: 'bg-accent-pink' },
  amber: { bg: 'bg-accent-amber/10', text: 'text-accent-amber', dot: 'bg-accent-amber' },
  green: { bg: 'bg-accent-green/10', text: 'text-accent-green', dot: 'bg-accent-green' },
  teal: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  gray: { bg: 'bg-gray-500/10', text: 'text-gray-400', dot: 'bg-gray-400' },
  orange: { bg: 'bg-orange-500/10', text: 'text-orange-400', dot: 'bg-orange-400' },
};

export default function ConceptDetector() {
  const code = useEditorStore((s) => s.code);
  const [concepts, setConcepts] = useState([]);
  const [selectedConcept, setSelectedConcept] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setConcepts(detectConcepts(code));
    }, 400);
    return () => clearTimeout(timer);
  }, [code]);

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-[var(--border-subtle)]">
        <span className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider font-medium">
          Detected Concepts
        </span>
        {concepts.length > 0 && (
          <span className="text-[10px] text-[var(--text-muted)] bg-[var(--bg-hover)] px-1.5 py-0.5 rounded-full ml-auto">
            {concepts.length}
          </span>
        )}
      </div>
      <div className="px-3 py-2 flex flex-wrap gap-1.5">
        <AnimatePresence>
          {concepts.map((concept, i) => {
            const colors = colorMap[concept.color] || colorMap.gray;
            return (
              <motion.button
                key={concept.name}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 400,
                  damping: 25,
                  delay: i * 0.05,
                }}
                onClick={() => setSelectedConcept(concept)}
                className={`badge-hover flex items-center gap-1.5 px-2 py-1 rounded-md ${colors.bg} transition-transform cursor-pointer`}
              >
                <span className="text-[12px]">{concept.icon}</span>
                <span className={`text-[11px] font-medium ${colors.text}`}>{concept.name}</span>
                <div className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
              </motion.button>
            );
          })}
        </AnimatePresence>
        {concepts.length === 0 && (
          <div className="text-[11px] text-[var(--text-muted)] py-1 opacity-50">
            Write some code to detect patterns
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedConcept && (
          <ExplainerDrawer
            concept={selectedConcept}
            onClose={() => setSelectedConcept(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
