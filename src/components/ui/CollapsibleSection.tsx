import { useState, type ReactNode } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

export function CollapsibleSection({
  title,
  defaultOpen,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen ?? true);
  return (
    <div className="border border-[var(--border-primary)] rounded-lg mb-4">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 text-left cursor-pointer"
      >
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h2>
        <span className="text-[var(--text-tertiary)]">
          {open ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </span>
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}
