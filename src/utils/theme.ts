export type ThemeMode = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'upvc_theme_mode';

/**
 * Reads the current theme preference from localStorage,
 * falling back to system preference (prefers-color-scheme: dark).
 */
export function getInitialTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'light';
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') {
      return saved;
    }
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
  } catch (e) {
    console.warn('Failed to read theme from storage', e);
  }
  return 'light';
}

/**
 * Applies the given theme to document.documentElement and persists to localStorage.
 */
export function applyTheme(theme: ThemeMode): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (e) {
    console.warn('Failed to save theme to storage', e);
  }
}

/**
 * Toggles the theme and applies it.
 */
export function toggleTheme(currentTheme: ThemeMode): ThemeMode {
  const next: ThemeMode = currentTheme === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  return next;
}
