import { useEffect, useRef, useState, useCallback } from 'react';
import { Platform } from 'react-native';
import type { InterstitialAd as InterstitialAdType } from 'react-native-google-mobile-ads';
import { getAdsConfig, getInterstitialAdUnitId } from '../ads-config';
import { canShowInterstitial, recordInterstitialShown } from '../ads-service';
import { getGoogleMobileAds, isGoogleMobileAdsAvailable, SafeAdEventType } from '../ads-native';

export function useInterstitialAd() {
  const [isLoaded, setIsLoaded] = useState(false);
  const interstitialRef = useRef<InterstitialAdType | null>(null);
  const unsubscribeLoadedRef = useRef<(() => void) | null>(null);
  const unsubscribeClosedRef = useRef<(() => void) | null>(null);
  const unsubscribeErrorRef = useRef<(() => void) | null>(null);
  const loadAdRef = useRef<() => void>(() => {});

  const loadAd = useCallback(() => {
    if (Platform.OS === 'web' || !isGoogleMobileAdsAvailable()) {
      return;
    }

    const config = getAdsConfig();
    if (!config.enabled || !config.interstitialsEnabled) {
      return;
    }

    const adsModule = getGoogleMobileAds();
    if (!adsModule || !adsModule.InterstitialAd) {
      return;
    }

    // Limpa ouvintes anteriores
    if (unsubscribeLoadedRef.current) unsubscribeLoadedRef.current();
    if (unsubscribeClosedRef.current) unsubscribeClosedRef.current();
    if (unsubscribeErrorRef.current) unsubscribeErrorRef.current();

    const adUnitId = getInterstitialAdUnitId();
    const interstitial = adsModule.InterstitialAd.createForAdRequest(adUnitId, {
      requestNonPersonalizedAdsOnly: true,
    });

    interstitialRef.current = interstitial;
    const loadedEvent = adsModule.AdEventType?.LOADED || SafeAdEventType.LOADED;
    const closedEvent = adsModule.AdEventType?.CLOSED || SafeAdEventType.CLOSED;
    const errorEvent = adsModule.AdEventType?.ERROR || SafeAdEventType.ERROR;

    unsubscribeLoadedRef.current = interstitial.addAdEventListener(
      loadedEvent,
      () => {
        setIsLoaded(true);
      },
    );

    unsubscribeClosedRef.current = interstitial.addAdEventListener(
      closedEvent,
      () => {
        setIsLoaded(false);
        recordInterstitialShown();
        // Pré-carrega o próximo anúncio em segundo plano via ref
        loadAdRef.current();
      },
    );

    unsubscribeErrorRef.current = interstitial.addAdEventListener(
      errorEvent,
      () => {
        setIsLoaded(false);
      },
    );

    interstitial.load();
  }, []);

  useEffect(() => {
    loadAdRef.current = loadAd;
  }, [loadAd]);

  useEffect(() => {
    loadAd();

    return () => {
      if (unsubscribeLoadedRef.current) unsubscribeLoadedRef.current();
      if (unsubscribeClosedRef.current) unsubscribeClosedRef.current();
      if (unsubscribeErrorRef.current) unsubscribeErrorRef.current();
    };
  }, [loadAd]);

  const showInterstitial = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === 'web' || !isGoogleMobileAdsAvailable()) {
      return false;
    }

    if (!canShowInterstitial()) {
      return false;
    }

    if (interstitialRef.current && isLoaded) {
      try {
        await interstitialRef.current.show();
        return true;
      } catch {
        return false;
      }
    }

    return false;
  }, [isLoaded]);

  return {
    isLoaded,
    showInterstitial,
    reloadAd: loadAd,
  };
}
