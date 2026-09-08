import React, { useState } from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { Radius, Spacing } from '@/constants/theme';
import { getAdsConfig, getBannerAdUnitId } from '../ads-config';
import { getGoogleMobileAds, isGoogleMobileAdsAvailable, SafeBannerAdSize } from '../ads-native';
import { AdPlacement } from '../types';

export interface AdBannerProps {
  placement: AdPlacement;
  style?: StyleProp<ViewStyle>;
}

export function AdBanner({ placement, style }: AdBannerProps) {
  const theme = useTheme();
  const config = getAdsConfig();
  const [hasError, setHasError] = useState(false);

  // Se o módulo nativo não existir (Expo Go/Web), anúncios estiverem desativados ou erro de carregamento: esconde
  if (!isGoogleMobileAdsAvailable() || !config.enabled || !config.bannersEnabled || hasError) {
    return null;
  }

  const adsModule = getGoogleMobileAds();
  if (!adsModule || !adsModule.BannerAd) {
    return null;
  }

  const BannerAd = adsModule.BannerAd;
  const bannerSize =
    adsModule.BannerAdSize?.ANCHORED_ADAPTIVE_BANNER || SafeBannerAdSize.ANCHORED_ADAPTIVE_BANNER;
  const adUnitId = getBannerAdUnitId();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
        },
        style,
      ]}
      accessibilityRole="none"
      accessibilityLabel="Publicidade"
    >
      {/* Etiqueta de identificação clara de publicidade (em conformidade com AdMob) */}
      <View style={styles.headerRow}>
        <Text style={[styles.adLabel, { color: theme.mutedForeground }]}>
          PUBLICIDADE
        </Text>
      </View>

      <View style={styles.adWrapper}>
        <BannerAd
          unitId={adUnitId}
          size={bannerSize}
          requestOptions={{
            requestNonPersonalizedAdsOnly: true,
          }}
          onAdLoaded={() => {
            setHasError(false);
          }}
          onAdFailedToLoad={() => {
            // Se não houver preenchimento (no-fill) ou sem conexão, esconde discretamente
            setHasError(true);
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Radius.medium,
    borderWidth: 1,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.one,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    minHeight: 64,
  },
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingHorizontal: Spacing.one,
    marginBottom: 2,
  },
  adLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  adWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    overflow: 'hidden',
  },
});
