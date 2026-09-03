/**
 * CadêMetrô Design Tokens
 * Support for Light and Dark modes with semantic metro colors.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    // Legacy / Core tokens
    text: '#0F172A',
    background: '#F8FAFC',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#E2E8F0',
    textSecondary: '#64748B',

    // Semantic tokens
    foreground: '#0F172A',
    muted: '#64748B',
    mutedForeground: '#94A3B8',
    card: '#FFFFFF',
    cardForeground: '#0F172A',
    border: '#E2E8F0',
    primary: '#0284C7',
    primaryForeground: '#FFFFFF',
    success: '#10B981',
    successForeground: '#FFFFFF',
    warning: '#F59E0B',
    warningForeground: '#FFFFFF',
    destructive: '#EF4444',
    destructiveForeground: '#FFFFFF',

    // Metro Status semantic colors
    statusNormal: '#10B981',
    statusNormalBg: '#ECFDF5',
    statusNormalBorder: '#A7F3D0',
    statusRestricted: '#F59E0B',
    statusRestrictedBg: '#FFFBEB',
    statusRestrictedBorder: '#FDE68A',
    statusInterrupted: '#EF4444',
    statusInterruptedBg: '#FEF2F2',
    statusInterruptedBorder: '#FECACA',
    statusUnknown: '#6B7280',
    statusUnknownBg: '#F3F4F6',
    statusUnknownBorder: '#E5E7EB',
  },
  dark: {
    // Legacy / Core tokens
    text: '#F8FAFC',
    background: '#090D16',
    backgroundElement: '#131B2E',
    backgroundSelected: '#1E293B',
    textSecondary: '#94A3B8',

    // Semantic tokens
    foreground: '#F8FAFC',
    muted: '#94A3B8',
    mutedForeground: '#64748B',
    card: '#131B2E',
    cardForeground: '#F8FAFC',
    border: '#1E293B',
    primary: '#38BDF8',
    primaryForeground: '#090D16',
    success: '#34D399',
    successForeground: '#064E3B',
    warning: '#FBBF24',
    warningForeground: '#78350F',
    destructive: '#F87171',
    destructiveForeground: '#7F1D1D',

    // Metro Status semantic colors
    statusNormal: '#34D399',
    statusNormalBg: '#064E3B44',
    statusNormalBorder: '#065F46',
    statusRestricted: '#FBBF24',
    statusRestrictedBg: '#78350F44',
    statusRestrictedBorder: '#92400E',
    statusInterrupted: '#F87171',
    statusInterruptedBg: '#7F1D1D44',
    statusInterruptedBorder: '#991B1B',
    statusUnknown: '#9CA3AF',
    statusUnknownBg: '#37415144',
    statusUnknownBorder: '#4B5563',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;
export type ColorTokens = Record<ThemeColor, string>;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    serif: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
    rounded: 'ui-rounded, "SF Pro Rounded", system-ui, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 48,
  seven: 64,
} as const;

export const Radius = {
  small: 6,
  medium: 12,
  large: 20,
  full: 9999,
} as const;

export const Typography = {
  display: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '700' as const,
  },
  heading: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '700' as const,
  },
  subheading: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '600' as const,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400' as const,
  },
  bodyBold: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600' as const,
  },
  caption: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500' as const,
  },
  small: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '500' as const,
  },
} as const;

export const Shadows = Platform.select({
  web: {
    card: {
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
    },
    hover: {
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
    },
  },
  default: {
    card: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
    hover: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
      elevation: 4,
    },
  },
}) as { card: any; hover: any };

export const BottomTabInset = Platform.select({ ios: 60, android: 80 }) ?? 60;
export const MaxContentWidth = 720;
