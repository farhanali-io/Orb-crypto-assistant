export type ColorMode = 'light' | 'dark';

export const COLOR_MODE_STORAGE_KEY = 'orbix_color_mode';

export function getInitialColorMode(): ColorMode {
  try {
    const stored = localStorage.getItem(COLOR_MODE_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    /* ignore */
  }
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'dark';
}
