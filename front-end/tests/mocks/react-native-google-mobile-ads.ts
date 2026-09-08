import React from 'react';

const mobileAds = () => ({
  initialize: async () => [],
  setRequestConfiguration: async () => {},
});

export default mobileAds;

export const BannerAdSize = {
  BANNER: 'BANNER',
  FULL_BANNER: 'FULL_BANNER',
  LARGE_BANNER: 'LARGE_BANNER',
  LEADERBOARD: 'LEADERBOARD',
  MEDIUM_RECTANGLE: 'MEDIUM_RECTANGLE',
  ANCHORED_ADAPTIVE_BANNER: 'ANCHORED_ADAPTIVE_BANNER',
};

export const TestIds = {
  BANNER: 'ca-app-pub-3940256099942544/6300978111',
  INTERSTITIAL: 'ca-app-pub-3940256099942544/1033173712',
  REWARDED: 'ca-app-pub-3940256099942544/5224354917',
  APP_OPEN: 'ca-app-pub-3940256099942544/9257390721',
};

export const AdEventType = {
  LOADED: 'loaded',
  OPENED: 'opened',
  CLOSED: 'closed',
  ERROR: 'error',
  CLICKED: 'clicked',
};

export class InterstitialAd {
  static createForAdRequest(adUnitId: string, options?: any) {
    return new InterstitialAd();
  }

  addAdEventListener(event: string, handler: (payload?: any) => void) {
    return () => {};
  }

  load() {}

  async show() {
    return true;
  }
}

export function BannerAd(props: any) {
  return React.createElement('div', { 'data-testid': 'mock-banner-ad', ...props });
}
