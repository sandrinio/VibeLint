import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'sm' | 'md';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

const variantStyles: Record<Variant, string> = {
  primary:
    'bg-[var(--accent-primary)] text-white border-transparent hover:bg-[var(--accent-hover)] active:bg-[var(--accent-active)]',
  secondary:
    'bg-transparent text-[var(--text-primary)] border-[var(--border-primary)] hover:bg-[var(--surface-hover)]',
  ghost:
    'bg-transparent text-[var(--text-secondary)] border-transparent hover:bg-[var(--surface-hover)]',
};

const sizeStyles: Record<Size, string> = {
  sm: 'h-7 px-3 text-[0.75rem]',
  md: 'h-8 px-3.5 text-[0.875rem]',
};

export function Button({
  variant = 'secondary',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-1.5 rounded-[6px] border font-medium cursor-pointer transition-[background-color,border-color] duration-100 ease-in-out disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)] ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
