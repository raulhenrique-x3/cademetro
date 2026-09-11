/**
 * Cross-platform storage utility.
 * Web: window.localStorage. Native (iOS/Android): expo-secure-store (encrypted,
 * persistent across app restarts). Backed by an in-memory cache so reads stay
 * synchronous; native values are loaded lazily once per key.
 */
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const memoryStorage = new Map<string, string>();

const isBrowser =
  typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const isNative =
  !isBrowser && (Platform.OS === 'ios' || Platform.OS === 'android');

function readFromPlatform(key: string): string | null {
  if (isBrowser) {
    return window.localStorage.getItem(key);
  }
  if (isNative) {
    return SecureStore.getItem(key);
  }
  return null;
}

function writeToPlatform(key: string, value: string): void {
  if (isBrowser) {
    window.localStorage.setItem(key, value);
  } else if (isNative) {
    SecureStore.setItem(key, value);
  }
}

function removeFromPlatform(key: string): void {
  if (isBrowser) {
    window.localStorage.removeItem(key);
  } else if (isNative) {
    SecureStore.deleteItemAsync(key).catch(() => {});
  }
}

export const storage = {
  getItem(key: string): string | null {
    try {
      if (!memoryStorage.has(key)) {
        const value = readFromPlatform(key);
        if (value != null) {
          memoryStorage.set(key, value);
        }
      }
      return memoryStorage.get(key) ?? null;
    } catch {
      return memoryStorage.get(key) ?? null;
    }
  },

  setItem(key: string, value: string): void {
    memoryStorage.set(key, value);
    try {
      writeToPlatform(key, value);
    } catch {
      // memory cache stays valid even if the platform write fails
    }
  },

  removeItem(key: string): void {
    memoryStorage.delete(key);
    try {
      removeFromPlatform(key);
    } catch {
      // ignore
    }
  },
};

export const AUTH_TOKEN_KEY = 'cademetro_access_token';
export const REFRESH_TOKEN_KEY = 'cademetro_refresh_token';
export const THEME_KEY = 'cademetro_theme_preference';
export const SELECTED_STATION_KEY = 'cademetro_selected_station';
