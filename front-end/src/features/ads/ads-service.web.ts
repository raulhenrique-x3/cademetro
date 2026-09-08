/**
 * Implementação Web segura do serviço de anúncios (No-Op para navegadores)
 */

export async function initializeAds(): Promise<boolean> {
  return false;
}

export function isAdsInitialized(): boolean {
  return false;
}

export function canShowInterstitial(): boolean {
  return false;
}

export function recordInterstitialShown(): void {
  // No-op na Web
}

export function getAdsSessionStats() {
  return {
    isInitialized: false,
    lastInterstitialShownTimestamp: 0,
    interstitialsShownInSessionCount: 0,
  };
}

export function resetSessionAdsTracking(): void {
  // No-op na Web
}
