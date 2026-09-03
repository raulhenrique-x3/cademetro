import { describe, it, expect, beforeEach } from 'vitest';
import { Colors } from '../src/constants/theme';
import { storage, THEME_KEY, AUTH_TOKEN_KEY } from '../src/lib/storage';

describe('Design Tokens & Storage', () => {
  describe('Semantic Theme Tokens', () => {
    it('defines all required semantic tokens in light mode', () => {
      const light = Colors.light;
      expect(light.background).toBeDefined();
      expect(light.foreground).toBeDefined();
      expect(light.muted).toBeDefined();
      expect(light.primary).toBeDefined();
      expect(light.success).toBeDefined();
      expect(light.warning).toBeDefined();
      expect(light.destructive).toBeDefined();
      expect(light.border).toBeDefined();
      expect(light.card).toBeDefined();

      // Metro operational status tokens
      expect(light.statusNormal).toBeDefined();
      expect(light.statusRestricted).toBeDefined();
      expect(light.statusInterrupted).toBeDefined();
      expect(light.statusUnknown).toBeDefined();
    });

    it('defines all required semantic tokens in dark mode', () => {
      const dark = Colors.dark;
      expect(dark.background).toBeDefined();
      expect(dark.foreground).toBeDefined();
      expect(dark.muted).toBeDefined();
      expect(dark.primary).toBeDefined();
      expect(dark.success).toBeDefined();
      expect(dark.warning).toBeDefined();
      expect(dark.destructive).toBeDefined();
      expect(dark.border).toBeDefined();
      expect(dark.card).toBeDefined();

      // Metro operational status tokens
      expect(dark.statusNormal).toBeDefined();
      expect(dark.statusRestricted).toBeDefined();
      expect(dark.statusInterrupted).toBeDefined();
      expect(dark.statusUnknown).toBeDefined();
    });

    it('has high contrast dark mode colors distinct from light mode', () => {
      expect(Colors.dark.background).not.toEqual(Colors.light.background);
      expect(Colors.dark.card).not.toEqual(Colors.light.card);
      expect(Colors.dark.text).not.toEqual(Colors.light.text);
    });
  });

  describe('Storage Adapter & Persistence', () => {
    beforeEach(() => {
      storage.removeItem(THEME_KEY);
      storage.removeItem(AUTH_TOKEN_KEY);
    });

    it('persists and retrieves values', () => {
      storage.setItem(THEME_KEY, 'dark');
      expect(storage.getItem(THEME_KEY)).toBe('dark');
    });

    it('removes stored keys correctly', () => {
      storage.setItem(AUTH_TOKEN_KEY, 'test-jwt-token');
      expect(storage.getItem(AUTH_TOKEN_KEY)).toBe('test-jwt-token');
      storage.removeItem(AUTH_TOKEN_KEY);
      expect(storage.getItem(AUTH_TOKEN_KEY)).toBeNull();
    });

    it('returns null for nonexistent keys', () => {
      expect(storage.getItem('nonexistent_key_1234')).toBeNull();
    });
  });
});
