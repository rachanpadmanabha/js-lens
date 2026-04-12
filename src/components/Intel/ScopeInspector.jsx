import useExecutionStore from '../../store/useExecutionStore';

const typeColors = {
  string: 'text-accent-green',
  number: 'text-accent-blue',
  function: 'text-accent-amber',
  object: 'text-accent-purple',
  array: 'text-accent-pink',
  boolean: 'text-gray-400',
  null: 'text-gray-500',
  undefined: 'text-gray-500',
  unknown: 'text-gray-400',
};

const typeBgColors = {
  string: 'bg-accent-green/10',
  number: 'bg-accent-blue/10',
  function: 'bg-accent-amber/10',
  object: 'bg-accent-purple/10',
  array: 'bg-accent-pink/10',
  boolean: 'bg-gray-500/10',
  null: 'bg-gray-600/10',
  undefined: 'bg-gray-600/10',
  unknown: 'bg-gray-500/10',
};

function ScopeNode({ scope, depth = 0 }) {
  const vars = scope.variables ? Object.values(scope.variables) : [];
  const children = scope.children || [];

  return (
    <div style={{ paddingLeft: depth * 12 }}>
      <div className="flex items-center gap-1.5 py-0.5">
        <span className="text-[11px] text-[var(--text-muted)]">
          {depth > 0 ? '└── ' : ''}
        </span>
        <span className="text-[11px] font-medium text-[var(--text-primary)]">
          {scope.type === 'global' ? 'Global Scope' : `${scope.name}()`}
        </span>
      </div>
      {vars.map((v) => (
        <div
          key={v.name}
          className="flex items-center gap-1.5 py-0.5"
          style={{ paddingLeft: (depth + 1) * 12 }}
        >
          <span className="text-[11px] text-[var(--text-muted)]">└──</span>
          {v.isClosure && (
            <span className="text-[9px] text-accent-purple bg-accent-purple/10 px-1 rounded">
              Closure
            </span>
          )}
          <span className="text-[11px] font-mono text-[var(--text-primary)]">{v.name}</span>
          <span className="text-[10px] text-[var(--text-muted)]">:</span>
          <span
            className={`text-[9px] px-1 py-0.5 rounded ${typeBgColors[v.type] || typeBgColors.unknown} ${typeColors[v.type] || typeColors.unknown}`}
          >
            {v.type}
          </span>
          <span className="text-[10px] font-mono text-[var(--text-muted)] truncate max-w-[80px]">
            {v.value}
          </span>
        </div>
      ))}
      {children.map((child, i) => (
        <ScopeNode key={child.name + i} scope={child} depth={depth + 1} />
      ))}
    </div>
  );
}

export default function ScopeInspector() {
  const scopeTree = useExecutionStore((s) => s.scopeTree);

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-[var(--border-subtle)]">
        <span className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider font-medium">
          Scope Tree
        </span>
      </div>
      <div className="px-3 py-2 overflow-y-auto">
        <ScopeNode scope={scopeTree} />
        {Object.keys(scopeTree.variables).length === 0 && scopeTree.children.length === 0 && (
          <div className="text-[11px] text-[var(--text-muted)] py-1 opacity-50">
            Run code to inspect scopes
          </div>
        )}
      </div>
    </div>
  );
}
