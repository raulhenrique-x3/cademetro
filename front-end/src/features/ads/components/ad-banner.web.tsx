import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { getAdsConfig } from '../ads-config';
import { AdPlacement } from '../types';

export interface AdBannerProps {
  placement: AdPlacement;
  style?: StyleProp<ViewStyle>;
}

/**
 * Versão Web do Banner de Publicidade.
 * Em desenvolvimento (__DEV__), renderiza um placeholder visual proporcional
 * para conferência de layout. Em produção web, não renderiza anúncios nativos.
 */
export function AdBanner({ placement, style }: AdBannerProps) {
  const theme = useTheme();
  const config = getAdsConfig();

  if (!config.enabled || !config.bannersEnabled) {
    return null;
  }

  // Em produção na web, o AdMob nativo não opera
  const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : false;
  if (!isDev) {
    return null;
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.backgroundElement,
          borderColor: theme.border,
        },
        style,
      ]}
      accessibilityRole="none"
      accessibilityLabel="Espaço publicitário reservado"
    >
      <View style={styles.headerRow}>
        <Text style={[styles.adLabel, { color: theme.mutedForeground }]}>
          PUBLICIDADE (MODO DESENVOLVIMENTO)
        </Text>
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.textSecondary }]}>
          Google AdMob • Banner Adaptativo
        </Text>
        <Text style={[styles.subtitle, { color: theme.mutedForeground }]}>
          Posição: {placement} (exibido nativamente no Android / iOS)
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Radius.medium,
    borderWidth: 1,
    borderStyle: 'dashed',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 64,
  },
  headerRow: {
    width: '100%',
    marginBottom: 4,
  },
  adLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  title: {
    fontSize: Typography.small.fontSize,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 11,
  },
});
