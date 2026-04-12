import useExecutionStore from '../../store/useExecutionStore';

export default function EventLoopIndicator() {
  const active = useExecutionStore((s) => s.eventLoopActive);

  const color = active ? '#34d399' : '#818cf8';
  const mutedColor = active ? '#34d399' : 'var(--text-muted)';

  return (
    <div className="flex items-center justify-center py-1.5 gap-2">
      {/* Left label — from queues */}
      <span className="text-[9px] text-[var(--text-muted)] tracking-wide uppercase">
        Queue
      </span>
      <svg width="24" height="8" viewBox="0 0 24 8" className="flex-shrink-0">
        <line x1="0" y1="4" x2="18" y2="4" stroke="var(--text-muted)" strokeWidth="1" strokeDasharray="3 2" />
        <polygon points="18,1.5 23,4 18,6.5" fill="var(--text-muted)" />
      </svg>

      {/* Event loop circle — fixed small size */}
      <div className="relative flex-shrink-0" style={{ width: 40, height: 40 }}>
        <svg
          width="40"
          height="40"
          viewBox="0 0 40 40"
          className={active ? 'event-loop-active' : 'event-loop-idle'}
          style={{ display: 'block' }}
        >
          <defs>
            <marker
              id="loop-arrow"
              markerWidth="6"
              markerHeight="5"
              refX="3"
              refY="2.5"
              orient="auto"
            >
              <polygon points="0,0 6,2.5 0,5" fill={color} />
            </marker>
          </defs>
          {/* Arc from ~315° (bottom-right gap) clockwise to ~280° with arrowhead */}
          <path
            d="M 32,8 A 17,17 0 1,1 26,4"
            fill="none"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            markerEnd="url(#loop-arrow)"
          />
        </svg>
        <span
          className="absolute inset-0 flex items-center justify-center text-center leading-tight pointer-events-none"
          style={{ fontSize: 7, fontWeight: 500, color: mutedColor, letterSpacing: '0.02em' }}
        >
          Event<br />Loop
        </span>
      </div>

      {/* Right label — to call stack */}
      <svg width="24" height="8" viewBox="0 0 24 8" className="flex-shrink-0">
        <line x1="0" y1="4" x2="18" y2="4" stroke="var(--text-muted)" strokeWidth="1" strokeDasharray="3 2" />
        <polygon points="18,1.5 23,4 18,6.5" fill="var(--text-muted)" />
      </svg>
      <span className="text-[9px] text-[var(--text-muted)] tracking-wide uppercase">
        Stack
      </span>
    </div>
  );
}
