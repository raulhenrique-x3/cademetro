import { Platform, TurboModuleRegistry, NativeModules } from 'react-native';

let hasLoggedExpoGoWarning = false;

/**
 * Verifica se o módulo nativo do Google Mobile Ads está registrado no binário em execução.
 * No Expo Go ou na Web, retorna false.
 * Em Development Builds (npx expo run:android / ios ou EAS Build), retorna true.
 */
export function isGoogleMobileAdsAvailable(): boolean {
  if (Platform.OS !== 'android' && Platform.OS !== 'ios') {
    return false;
  }
  try {
    const turboModule = TurboModuleRegistry?.get
      ? TurboModuleRegistry.get('RNGoogleMobileAdsModule')
      : null;
    const legacyModule = (NativeModules as Record<string, unknown> | undefined)?.RNGoogleMobileAdsModule;
    const isAvailable = Boolean(turboModule || legacyModule);

    if (!isAvailable && typeof __DEV__ !== 'undefined' && __DEV__ && !hasLoggedExpoGoWarning) {
      console.info(
        '[AdMob] Módulo nativo "RNGoogleMobileAdsModule" não encontrado no binário (Expo Go ou Web). ' +
          'Anúncios desativados em modo de compatibilidade. Para testar anúncios reais, utilize um Development Build.',
      );
      hasLoggedExpoGoWarning = true;
    }

    return isAvailable;
  } catch {
    return false;
  }
}

/**
 * Carrega dinamicamente o módulo react-native-google-mobile-ads apenas se o suporte nativo existir.
 */
export function getGoogleMobileAds(): typeof import('react-native-google-mobile-ads') | null {
  if (!isGoogleMobileAdsAvailable()) {
    return null;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('react-native-google-mobile-ads');
  } catch (error) {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.warn('[AdMob] Erro ao carregar react-native-google-mobile-ads:', error);
    }
    return null;
  }
}

/**
 * Constantes seguras de fallback para tamanhos de banner e eventos de anúncios
 */
export const SafeBannerAdSize = {
  BANNER: 'BANNER',
  FULL_BANNER: 'FULL_BANNER',
  LARGE_BANNER: 'LARGE_BANNER',
  LEADERBOARD: 'LEADERBOARD',
  MEDIUM_RECTANGLE: 'MEDIUM_RECTANGLE',
  ANCHORED_ADAPTIVE_BANNER: 'ANCHORED_ADAPTIVE_BANNER',
} as const;

export const SafeAdEventType = {
  LOADED: 'loaded',
  OPENED: 'opened',
  CLOSED: 'closed',
  ERROR: 'error',
  CLICKED: 'clicked',
} as const;
