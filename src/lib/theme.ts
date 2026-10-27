import { useSyncExternalStore } from 'react';

export type Theme = 'light' | 'dark';
const KEY = 'daily-rigor/theme/v1';
const listeners = new Set<() => void>();

const systemTheme = (): Theme => (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

function stored(): Theme | null {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'light' || v === 'dark' ? v : null;
  } catch {
    return null;
  }
}

/** Applies the saved theme (or none, so the system preference decides). Also called by a tiny script in index.html before first paint. */
export function applyTheme() {
  const t = stored();
  if (t) document.documentElement.dataset.theme = t;
  else delete document.documentElement.dataset.theme;
}

const current = (): Theme => stored() ?? systemTheme();

function subscribe(cb: () => void) {
  listeners.add(cb);
  const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
  mq?.addEventListener('change', cb);
  window.addEventListener('storage', cb);
  return () => {
    listeners.delete(cb);
    mq?.removeEventListener('change', cb);
    window.removeEventListener('storage', cb);
  };
}

export function useTheme(): [Theme, () => void] {
  const theme = useSyncExternalStore(subscribe, current);
  const toggle = () => {
    try { localStorage.setItem(KEY, theme === 'dark' ? 'light' : 'dark'); } catch { /* private mode: theme just won't persist */ }
    applyTheme();
    listeners.forEach((l) => l());
  };
  return [theme, toggle];
}
