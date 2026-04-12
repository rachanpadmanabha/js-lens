import useEditorStore from '../../store/useEditorStore';
import { stepForward } from '../../engine/stepRunner';

export default function EditorToolbar() {
  const { stepMode, currentStep, totalSteps } = useEditorStore();

  const handleStep = () => {
    stepForward();
  };

  if (!stepMode) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 border-b border-[var(--border-subtle)]">
      <button
        onClick={handleStep}
        disabled={currentStep >= totalSteps && totalSteps > 0}
        className="flex items-center gap-1 px-2.5 py-1 rounded-md border border-accent-amber/40 text-accent-amber text-[11px] font-medium hover:bg-accent-amber/10 transition-colors btn-press disabled:opacity-40"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
          <polygon points="5,3 15,12 5,21" />
          <rect x="17" y="3" width="3" height="18" />
        </svg>
        Step
      </button>
      {totalSteps > 0 && (
        <span className="text-[11px] font-mono text-[var(--text-muted)] bg-[var(--bg-hover)] px-2 py-0.5 rounded">
          Step {currentStep} / {totalSteps}
        </span>
      )}
    </div>
  );
}
