import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getAdsConfig,
  getBannerAdUnitId,
  getInterstitialAdUnitId,
  TEST_AD_UNITS,
  PRODUCTION_AD_UNITS,
} from '@/features/ads/ads-config';
import {
  initializeAds,
  isGoogleMobileAdsAvailable,
  getGoogleMobileAds,
  canShowInterstitial,
  recordInterstitialShown,
  resetSessionAdsTracking,
  getAdsSessionStats,
} from '@/features/ads';

describe('AdMob Configuration and Frequency Capping', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    resetSessionAdsTracking();
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe('ads-config', () => {
    it('deve carregar as configurações padrões em ambiente de teste/dev', () => {
      delete process.env.EXPO_PUBLIC_ADS_ENABLED;
      delete process.env.EXPO_PUBLIC_ADS_TEST_MODE;
      delete process.env.EXPO_PUBLIC_ENABLE_INTERSTITIALS;

      const config = getAdsConfig();
      expect(config.enabled).toBe(true);
      expect(config.bannersEnabled).toBe(true);
      expect(config.interstitialCooldownSeconds).toBe(420);
      expect(config.maxInterstitialsPerSession).toBe(2);
    });

    it('deve desativar anúncios quando EXPO_PUBLIC_ADS_ENABLED for false', () => {
      process.env.EXPO_PUBLIC_ADS_ENABLED = 'false';

      const config = getAdsConfig();
      expect(config.enabled).toBe(false);
      expect(config.bannersEnabled).toBe(false);
      expect(config.interstitialsEnabled).toBe(false);
    });

    it('deve retornar IDs oficiais de teste do Google em modo de teste', () => {
      process.env.EXPO_PUBLIC_ADS_TEST_MODE = 'true';

      expect(getBannerAdUnitId('android')).toBe(TEST_AD_UNITS.banner.android);
      expect(getBannerAdUnitId('ios')).toBe(TEST_AD_UNITS.banner.ios);
      expect(getInterstitialAdUnitId('android')).toBe(TEST_AD_UNITS.interstitial.android);
      expect(getInterstitialAdUnitId('ios')).toBe(TEST_AD_UNITS.interstitial.ios);
    });

    it('deve retornar IDs de produção quando configurados e testMode for false', () => {
      process.env.EXPO_PUBLIC_ADS_TEST_MODE = 'false';
      process.env.EXPO_PUBLIC_ADMOB_BANNER_ID_ANDROID = 'ca-app-pub-custom/111111';
      process.env.EXPO_PUBLIC_ADMOB_BANNER_ID_IOS = 'ca-app-pub-custom/222222';
      process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_ID_ANDROID = 'ca-app-pub-custom/333333';
      process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_ID_IOS = 'ca-app-pub-custom/444444';

      expect(getBannerAdUnitId('android')).toBe('ca-app-pub-custom/111111');
      expect(getBannerAdUnitId('ios')).toBe('ca-app-pub-custom/222222');
      expect(getInterstitialAdUnitId('android')).toBe('ca-app-pub-custom/333333');
      expect(getInterstitialAdUnitId('ios')).toBe('ca-app-pub-custom/444444');
    });

    it('deve fazer fallback para o bloco oficial de produção se testMode for false e variável customizada não estiver definida', () => {
      process.env.EXPO_PUBLIC_ADS_TEST_MODE = 'false';
      delete process.env.EXPO_PUBLIC_ADMOB_BANNER_ID_ANDROID;

      expect(getBannerAdUnitId('android')).toBe(PRODUCTION_AD_UNITS.banner.android);
      expect(getBannerAdUnitId('android')).toBe('ca-app-pub-3861308228006485/5630974858');
    });

    it('deve fazer fallback para IDs de teste em intersticiais se testMode for false mas sem unidade de produção configurada', () => {
      process.env.EXPO_PUBLIC_ADS_TEST_MODE = 'false';
      delete process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_ID_ANDROID;

      expect(getInterstitialAdUnitId('android')).toBe(TEST_AD_UNITS.interstitial.android);
    });
  });

  describe('ads-service Frequency Capping', () => {
    it('deve retornar false para canShowInterstitial se intersticiais não estiverem habilitados', () => {
      delete process.env.EXPO_PUBLIC_ENABLE_INTERSTITIALS;

      expect(canShowInterstitial()).toBe(false);
    });

    it('deve permitir primeiro anúncio quando intersticiais estiverem habilitados', () => {
      process.env.EXPO_PUBLIC_ENABLE_INTERSTITIALS = 'true';

      expect(canShowInterstitial()).toBe(true);
    });

    it('deve bloquear segundo anúncio antes do cooldown de 7 minutos (420s)', () => {
      process.env.EXPO_PUBLIC_ENABLE_INTERSTITIALS = 'true';

      expect(canShowInterstitial()).toBe(true);
      recordInterstitialShown();

      const statsAfterFirst = getAdsSessionStats();
      expect(statsAfterFirst.interstitialsShownInSessionCount).toBe(1);

      // Tentativa imediata deve ser bloqueada
      expect(canShowInterstitial()).toBe(false);
    });

    it('deve permitir segundo anúncio após o término do cooldown de 420s', () => {
      process.env.EXPO_PUBLIC_ENABLE_INTERSTITIALS = 'true';

      const initialTime = 1000000;
      vi.spyOn(Date, 'now').mockReturnValue(initialTime);

      expect(canShowInterstitial()).toBe(true);
      recordInterstitialShown();

      // Após 300 segundos (5 min) ainda deve bloquear
      vi.spyOn(Date, 'now').mockReturnValue(initialTime + 300 * 1000);
      expect(canShowInterstitial()).toBe(false);

      // Após 421 segundos (> 7 min) deve liberar
      vi.spyOn(Date, 'now').mockReturnValue(initialTime + 421 * 1000);
      expect(canShowInterstitial()).toBe(true);
    });

    it('deve respeitar o limite máximo de 2 anúncios por sessão', () => {
      process.env.EXPO_PUBLIC_ENABLE_INTERSTITIALS = 'true';

      let currentTime = 1000000;
      vi.spyOn(Date, 'now').mockImplementation(() => currentTime);

      // 1º anúncio
      expect(canShowInterstitial()).toBe(true);
      recordInterstitialShown();

      // Avança cooldown
      currentTime += 500 * 1000;

      // 2º anúncio
      expect(canShowInterstitial()).toBe(true);
      recordInterstitialShown();

      // Avança cooldown novamente
      currentTime += 500 * 1000;

      // 3º anúncio deve ser bloqueado por exceder o teto da sessão
      expect(canShowInterstitial()).toBe(false);
    });

    it('deve resetar contadores corretamente com resetSessionAdsTracking', () => {
      process.env.EXPO_PUBLIC_ENABLE_INTERSTITIALS = 'true';

      recordInterstitialShown();
      expect(getAdsSessionStats().interstitialsShownInSessionCount).toBe(1);

      resetSessionAdsTracking();
      expect(getAdsSessionStats().interstitialsShownInSessionCount).toBe(0);
      expect(getAdsSessionStats().lastInterstitialShownTimestamp).toBe(0);
      expect(canShowInterstitial()).toBe(true);
    });
  });

  describe('Native Ads Safety & Fallbacks (Expo Go & Web compatibility)', () => {
    it('isGoogleMobileAdsAvailable deve retornar false quando não estiver em android/ios com suporte nativo', () => {
      // No ambiente de teste vitest (Node/Web), não há TurboModule nativo
      expect(isGoogleMobileAdsAvailable()).toBe(false);
    });

    it('getGoogleMobileAds deve retornar null de forma segura sem lançar exceção', () => {
      expect(getGoogleMobileAds()).toBeNull();
    });

    it('initializeAds deve retornar false graciosamente sem lançar erro de TurboModule', async () => {
      const result = await initializeAds();
      expect(result).toBe(false);
    });
  });
});
