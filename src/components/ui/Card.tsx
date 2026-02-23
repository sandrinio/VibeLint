import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div
      className={`rounded-lg border border-[var(--border-primary)] bg-[var(--surface-primary)] p-4 shadow-[var(--shadow-sm)] ${className}`}
    >
      {children}
    </div>
  );
}
