import { useEffect } from 'react';
import { X } from 'lucide-react';

export interface ToastData {
  id: number;
  message: string;
  type: 'success' | 'error';
}

/** Single toast notification (auto-dismisses after 3s). */
export function ToastNotification({
  toast,
  onDismiss,
}: {
  toast: ToastData;
  onDismiss: (id: number) => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 3000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const bgClass =
    toast.type === 'success'
      ? 'border-[var(--status-pass)] bg-[var(--status-pass-bg)] text-[var(--status-pass)]'
      : 'border-[var(--status-fail)] bg-[var(--status-fail-bg)] text-[var(--status-fail)]';

  return (
    <div
      className={`flex items-center gap-2 rounded-[8px] border px-4 py-3 text-[0.875rem] shadow-[var(--shadow-md)] ${bgClass}`}
    >
      <span>{toast.message}</span>
      <button
        onClick={() => onDismiss(toast.id)}
        className="ml-2 shrink-0 cursor-pointer rounded-[4px] border-none bg-transparent p-0.5 opacity-60 transition-opacity hover:opacity-100"
      >
        <X size={14} />
      </button>
    </div>
  );
}

/** Container that renders a stack of toasts in the bottom-right corner. */
export function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastData[];
  onDismiss: (id: number) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <ToastNotification key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
