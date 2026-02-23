import { Button } from './Button';

export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
  variant = 'danger',
}: {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'primary';
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-[400px] rounded-[8px] border border-[var(--border-primary)] bg-[var(--surface-primary)] p-6 shadow-[var(--shadow-lg)]">
        <h3 className="mb-1 text-[1rem] font-semibold text-[var(--text-primary)]">{title}</h3>
        <p className="mb-4 text-[0.875rem] text-[var(--text-secondary)]">{message}</p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <button
            onClick={onConfirm}
            className={`inline-flex items-center justify-center gap-1.5 rounded-[6px] border-none px-3.5 py-2 text-[0.875rem] font-medium cursor-pointer transition-colors duration-100 ${
              variant === 'danger'
                ? 'bg-[var(--status-fail)] text-white hover:opacity-90'
                : 'bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-hover)]'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
