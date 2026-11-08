export const SPLASH_STORAGE_KEY = 'plainsyt_splash_shown';

/** Splash shows only on a visitor's very first visit, never with reduced-motion, or via ?splash=1. */
export function shouldShowSplash(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    if (new URLSearchParams(window.location.search).has('splash')) return true;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return false;
    return !localStorage.getItem(SPLASH_STORAGE_KEY);
  } catch {
    return false;
  }
}
