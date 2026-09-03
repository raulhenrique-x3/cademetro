/**
 * Cross-platform storage utility.
 * Uses window.localStorage on web/browser, with in-memory fallback.
 */

const memoryStorage = new Map<string, string>();

const isBrowser = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

export const storage = {
  getItem(key: string): string | null {
    try {
      if (isBrowser) {
        return window.localStorage.getItem(key);
      }
      return memoryStorage.get(key) ?? null;
    } catch {
      return memoryStorage.get(key) ?? null;
    }
  },

  setItem(key: string, value: string): void {
    try {
      if (isBrowser) {
        window.localStorage.setItem(key, value);
      }
      memoryStorage.set(key, value);
    } catch {
      memoryStorage.set(key, value);
    }
  },

  removeItem(key: string): void {
    try {
      if (isBrowser) {
        window.localStorage.removeItem(key);
      }
      memoryStorage.delete(key);
    } catch {
      memoryStorage.delete(key);
    }
  },
};

export const AUTH_TOKEN_KEY = 'cademetro_access_token';
export const REFRESH_TOKEN_KEY = 'cademetro_refresh_token';
export const THEME_KEY = 'cademetro_theme_preference';
export const SELECTED_STATION_KEY = 'cademetro_selected_station';
