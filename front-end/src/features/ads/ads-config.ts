import { Platform } from 'react-native';
import { AdsConfig, AdUnitIds } from './types';

/**
 * Unidades oficiais de teste do Google AdMob (Sample Ad Units)
 * https://developers.google.com/admob/android/test-ads
 * https://developers.google.com/admob/ios/test-ads
 */
export const TEST_AD_UNITS: AdUnitIds = {
  banner: {
    android: 'ca-app-pub-3940256099942544/6300978111',
    ios: 'ca-app-pub-3940256099942544/2934735716',
  },
  interstitial: {
    android: 'ca-app-pub-3940256099942544/1033173712',
    ios: 'ca-app-pub-3940256099942544/4411468910',
  },
};

/**
 * Unidades oficiais de produção do Cadê Metrô no Google AdMob
 */
export const PRODUCTION_AD_UNITS: AdUnitIds = {
  banner: {
    android: 'ca-app-pub-3861308228006485/5630974858',
    ios: 'ca-app-pub-3861308228006485/5630974858',
  },
  interstitial: {
    android: '',
    ios: '',
  },
};

/**
 * Lê variáveis de ambiente com fallback para os valores padrões de desenvolvimento
 */
export function getAdsConfig(): AdsConfig {
  const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : false;
  
  // Se explicitamente setado como false, desativa
  const enabledEnv = process.env.EXPO_PUBLIC_ADS_ENABLED;
  const enabled = enabledEnv !== undefined ? enabledEnv === 'true' : true;

  // Modo de teste: padrão ativo em dev, ou controlado por env
  const testModeEnv = process.env.EXPO_PUBLIC_ADS_TEST_MODE;
  const testMode = testModeEnv !== undefined ? testModeEnv === 'true' : isDev;

  const interstitialsEnv = process.env.EXPO_PUBLIC_ENABLE_INTERSTITIALS;
  const interstitialsEnabled =
    interstitialsEnv !== undefined ? interstitialsEnv === 'true' : false;

  return {
    enabled,
    testMode,
    bannersEnabled: enabled,
    interstitialsEnabled: enabled && interstitialsEnabled,
    interstitialCooldownSeconds: 420, // 7 minutos de intervalo mínimo
    maxInterstitialsPerSession: 2, // Máximo de 2 anúncios em tela cheia por sessão
  };
}

/**
 * Obtém o Ad Unit ID correto para Banners de acordo com plataforma e ambiente
 */
export function getBannerAdUnitId(platform: 'android' | 'ios' = Platform.OS === 'ios' ? 'ios' : 'android'): string {
  const config = getAdsConfig();

  // Em modo de teste, usa sempre as unidades de teste do Google
  if (config.testMode) {
    return platform === 'ios' ? TEST_AD_UNITS.banner.ios : TEST_AD_UNITS.banner.android;
  }

  // Em produção, usa as variáveis de ambiente ou fallback para o bloco oficial de produção
  const prodId =
    platform === 'ios'
      ? process.env.EXPO_PUBLIC_ADMOB_BANNER_ID_IOS
      : process.env.EXPO_PUBLIC_ADMOB_BANNER_ID_ANDROID;

  if (prodId && prodId.trim().length > 0) {
    return prodId.trim();
  }

  const defaultProdId =
    platform === 'ios'
      ? PRODUCTION_AD_UNITS.banner.ios
      : PRODUCTION_AD_UNITS.banner.android;

  return defaultProdId && defaultProdId.trim().length > 0
    ? defaultProdId.trim()
    : platform === 'ios'
      ? TEST_AD_UNITS.banner.ios
      : TEST_AD_UNITS.banner.android;
}

/**
 * Obtém o Ad Unit ID correto para Intersticiais de acordo com plataforma e ambiente
 */
export function getInterstitialAdUnitId(platform: 'android' | 'ios' = Platform.OS === 'ios' ? 'ios' : 'android'): string {
  const config = getAdsConfig();

  if (config.testMode) {
    return platform === 'ios' ? TEST_AD_UNITS.interstitial.ios : TEST_AD_UNITS.interstitial.android;
  }

  const prodId =
    platform === 'ios'
      ? process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_ID_IOS
      : process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_ID_ANDROID;

  return prodId && prodId.trim().length > 0
    ? prodId.trim()
    : platform === 'ios'
      ? TEST_AD_UNITS.interstitial.ios
      : TEST_AD_UNITS.interstitial.android;
}
