import type { ReactNode } from 'react';

type BadgeVariant = 'pass' | 'warn' | 'fail' | 'info' | 'neutral';

interface BadgeProps {
  variant: BadgeVariant;
  children: ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  pass: 'text-[var(--status-pass)] bg-[var(--status-pass-bg)]',
  warn: 'text-[var(--status-warn)] bg-[var(--status-warn-bg)]',
  fail: 'text-[var(--status-fail)] bg-[var(--status-fail-bg)]',
  info: 'text-[var(--status-info)] bg-[var(--status-info-bg)]',
  neutral: 'text-[var(--text-tertiary)] bg-[var(--bg-tertiary)]',
};

export function Badge({ variant, children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.6875rem] font-medium tracking-[0.02em] ${variantStyles[variant]}`}
    >
      {children}
    </span>
  );
}
