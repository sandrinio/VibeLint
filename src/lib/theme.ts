export type Theme = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'vibelint-theme';

export function getStoredTheme(): Theme {
  return (localStorage.getItem(STORAGE_KEY) as Theme) ?? 'system';
}

export function resolveTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return theme;
}

export function applyTheme(theme: Theme, animate = true) {
  const root = document.documentElement;

  if (animate) {
    // Enable transition for smooth theme switch
    root.setAttribute('data-theme-transitioning', '');
    // Remove after transition completes
    setTimeout(() => root.removeAttribute('data-theme-transitioning'), 250);
  }

  root.setAttribute('data-theme', resolveTheme(theme));
  localStorage.setItem(STORAGE_KEY, theme);
}

export function initTheme() {
  // No animation on first load
  applyTheme(getStoredTheme(), false);

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (getStoredTheme() === 'system') applyTheme('system');
  });
}
