import type { RunStore } from './run-store';

const COLORS: Record<string, { bg: string; fg: string }> = {
  Running: { bg: '#dbeafe', fg: '#1d4ed8' },
  'Waiting for approval': { bg: '#fef3c7', fg: '#b45309' },
  Completed: { bg: '#dcfce7', fg: '#15803d' },
  Failed: { bg: '#fee2e2', fg: '#b91c1c' },
};

// Plain, always-visible text readout of the last-triggered workflow's status
// — Running / Waiting for approval / Completed / Failed — backed by the same
// StatusPoller/run-store the live-highlight ring already uses, just rendered
// as a label instead of a canvas glow.
export function StatusBadge({ useRunStore }: { useRunStore: RunStore }) {
  const lastWorkflowId = useRunStore((s) => s.lastWorkflowId);
  const displayStatus = useRunStore((s) => s.displayStatus);

  if (!lastWorkflowId) {
    return null;
  }

  const label = displayStatus ?? 'Starting…';
  const colors = COLORS[label] ?? { bg: '#e5e7eb', fg: '#374151' };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        background: colors.bg,
        color: colors.fg,
        whiteSpace: 'nowrap',
      }}
      title={`Workflow ${lastWorkflowId}`}
    >
      {label}
    </span>
  );
}
