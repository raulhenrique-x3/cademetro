import { Platform } from 'react-native';
import mobileAds from 'react-native-google-mobile-ads';
import { getAdsConfig } from './ads-config';

let isInitialized = false;
let lastInterstitialShownTimestamp = 0;
let interstitialsShownInSessionCount = 0;

/**
 * Inicializa o SDK nativo do Google Mobile Ads (apenas em iOS e Android)
 */
export async function initializeAds(): Promise<boolean> {
  if (Platform.OS === 'web') {
    return false;
  }

  if (isInitialized) {
    return true;
  }

  const config = getAdsConfig();
  if (!config.enabled) {
    return false;
  }

  try {
    await mobileAds().initialize();
    isInitialized = true;
    return true;
  } catch (error) {
    console.warn('[AdMob] Falha ao inicializar Google Mobile Ads:', error);
    return false;
  }
}

/**
 * Retorna se o SDK já foi inicializado
 */
export function isAdsInitialized(): boolean {
  return isInitialized;
}

/**
 * Verifica se as regras de Frequency Capping permitem exibir um anúncio intersticial agora
 */
export function canShowInterstitial(): boolean {
  const config = getAdsConfig();

  // Anúncios ou intersticiais desabilitados
  if (!config.enabled || !config.interstitialsEnabled) {
    return false;
  }

  // Limite por sessão atingido
  if (interstitialsShownInSessionCount >= config.maxInterstitialsPerSession) {
    return false;
  }

  // Cooldown de tempo mínimo desde a última exibição
  const now = Date.now();
  const elapsedSeconds = (now - lastInterstitialShownTimestamp) / 1000;
  if (lastInterstitialShownTimestamp > 0 && elapsedSeconds < config.interstitialCooldownSeconds) {
    return false;
  }

  return true;
}

/**
 * Registra a exibição de um anúncio intersticial para controle de intervalo
 */
export function recordInterstitialShown(): void {
  lastInterstitialShownTimestamp = Date.now();
  interstitialsShownInSessionCount += 1;
}

/**
 * Obtém estatísticas da sessão atual (útil para debug e monitoramento)
 */
export function getAdsSessionStats() {
  return {
    isInitialized,
    lastInterstitialShownTimestamp,
    interstitialsShownInSessionCount,
  };
}

/**
 * Reseta os contadores da sessão (útil em logout ou testes)
 */
export function resetSessionAdsTracking(): void {
  lastInterstitialShownTimestamp = 0;
  interstitialsShownInSessionCount = 0;
}
