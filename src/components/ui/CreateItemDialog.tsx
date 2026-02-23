import { useState, useEffect, useRef } from 'react';
import { Button } from './Button';

const NAME_PATTERN = /^[a-zA-Z0-9_-]+$/;

export function CreateItemDialog({
  title,
  description,
  placeholder,
  onConfirm,
  onCancel,
}: {
  title: string;
  description: string;
  placeholder: string;
  onConfirm: (name: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleSubmit() {
    const trimmed = name.trim();
    if (!trimmed) {
      setValidationError('Name is required');
      return;
    }
    if (!NAME_PATTERN.test(trimmed)) {
      setValidationError('Name may only contain letters, numbers, hyphens, and underscores');
      return;
    }
    onConfirm(trimmed);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-[400px] rounded-[8px] border border-[var(--border-primary)] bg-[var(--surface-primary)] p-6 shadow-[var(--shadow-lg)]">
        <h3 className="mb-1 text-[1rem] font-semibold text-[var(--text-primary)]">
          {title}
        </h3>
        <p className="mb-4 text-[0.875rem] text-[var(--text-secondary)]">
          {description}
        </p>

        <input
          ref={inputRef}
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setValidationError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSubmit();
            if (e.key === 'Escape') onCancel();
          }}
          placeholder={placeholder}
          className="mb-2 w-full rounded-[6px] border border-[var(--border-primary)] bg-[var(--bg-primary)] px-3 py-2 text-[0.875rem] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:border-[var(--border-focus)] focus:shadow-[var(--focus-ring)]"
        />

        {validationError && (
          <p className="mb-2 text-[0.75rem] text-[var(--status-fail)]">{validationError}</p>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            Create
          </Button>
        </div>
      </div>
    </div>
  );
}
