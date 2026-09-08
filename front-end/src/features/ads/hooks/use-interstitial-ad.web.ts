import { useCallback } from 'react';

/**
 * Implementação Web segura do hook de intersticial (No-Op)
 */
export function useInterstitialAd() {
  const showInterstitial = useCallback(async (): Promise<boolean> => {
    return false;
  }, []);

  const reloadAd = useCallback(() => {
    // No-op na web
  }, []);

  return {
    isLoaded: false,
    showInterstitial,
    reloadAd,
  };
}
