import { motion } from 'framer-motion';

const glowClasses = {
  blue: 'glow-blue',
  purple: 'glow-purple',
  amber: 'glow-amber',
  pink: 'glow-pink',
  green: 'glow-green',
  indigo: 'glow-indigo',
};

const borderColors = {
  blue: 'border-accent-blue/20',
  purple: 'border-accent-purple/20',
  amber: 'border-accent-amber/20',
  pink: 'border-accent-pink/20',
  green: 'border-accent-green/20',
  indigo: 'border-accent-indigo/20',
};

export default function QueueCard({ name, detail, glow = 'blue', layout = 'vertical' }) {
  return (
    <div
      className={`glass-panel ${glowClasses[glow]} card-hover px-3 py-2 transition-all duration-150 ${
        layout === 'horizontal' ? 'flex-shrink-0 min-w-[140px]' : ''
      }`}
    >
      <div className="text-[12px] font-medium text-[var(--text-primary)] truncate">{name}</div>
      {detail && (
        <div className="text-[11px] text-[var(--text-muted)] truncate mt-0.5">{detail}</div>
      )}
    </div>
  );
}
