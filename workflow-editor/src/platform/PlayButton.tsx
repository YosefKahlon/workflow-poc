type PlayButtonProps = {
  label: string;
  onClick: () => void;
  busy?: boolean;
  disabled?: boolean;
  title?: string;
};

// Shared "start a workflow" control — any domain's trigger button uses this
// for a consistent look, instead of each domain rolling its own button style.
export function PlayButton({ label, onClick, busy, disabled, title }: PlayButtonProps) {
  const isDisabled = Boolean(disabled || busy);
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      title={title}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 14px 6px 10px',
        borderRadius: 999,
        border: 'none',
        background: isDisabled ? '#9ca3af' : '#16a34a',
        color: 'white',
        fontWeight: 600,
        fontSize: 12,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
      }}
    >
      <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
        <path d="M4 2.5v11l10-5.5z" />
      </svg>
      {busy ? 'Starting…' : label}
    </button>
  );
}
