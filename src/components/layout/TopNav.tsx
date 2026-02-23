import { Sun, Moon, Monitor } from 'lucide-react';
import { type Theme, getStoredTheme, applyTheme } from '../../lib/theme';
import { useState } from 'react';

const options: { value: Theme; icon: typeof Sun; label: string }[] = [
  { value: 'light', icon: Sun, label: 'Light' },
  { value: 'system', icon: Monitor, label: 'System' },
  { value: 'dark', icon: Moon, label: 'Dark' },
];

export function TopNav() {
  const [theme, setTheme] = useState<Theme>(getStoredTheme);

  function handleTheme(t: Theme) {
    setTheme(t);
    applyTheme(t);
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-30 flex h-12 items-center justify-between border-b border-[var(--border-primary)] bg-[var(--bg-primary)] px-4">
      <div className="flex items-center gap-6">
        <span className="text-[1rem] font-semibold tracking-[-0.01em] text-[var(--text-primary)]">
          VibeLint
        </span>
        <nav className="flex items-center gap-1">
          {['Repos', 'Skills', 'Rules', 'Analysis', 'Trends', 'Docs'].map(
            (item) => (
              <a
                key={item}
                href="#"
                className={`rounded-[6px] px-2.5 py-1.5 text-[0.875rem] no-underline transition-colors duration-100 ${
                  item === 'Repos'
                    ? 'bg-[var(--accent-subtle)] font-medium text-[var(--accent-primary)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]'
                }`}
              >
                {item}
              </a>
            ),
          )}
        </nav>
      </div>

      {/* Theme toggle — segmented control */}
      <div className="flex items-center rounded-[6px] border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-0.5">
        {options.map(({ value, icon: Icon, label }) => (
          <button
            key={value}
            onClick={() => handleTheme(value)}
            aria-label={`${label} theme`}
            className={`flex items-center gap-1 rounded-[4px] border-none px-2 py-1 text-[0.75rem] font-medium cursor-pointer transition-all duration-100 ${
              theme === value
                ? 'bg-[var(--surface-primary)] text-[var(--text-primary)] shadow-[var(--shadow-sm)]'
                : 'bg-transparent text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>
    </header>
  );
}
