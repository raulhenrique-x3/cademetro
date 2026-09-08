export type AdPlacement =
  | 'home_feed'
  | 'explore_list'
  | 'station_detail'
  | 'line_detail'
  | 'profile_bottom';

export interface AdsConfig {
  enabled: boolean;
  testMode: boolean;
  bannersEnabled: boolean;
  interstitialsEnabled: boolean;
  interstitialCooldownSeconds: number;
  maxInterstitialsPerSession: number;
}

export interface AdUnitIds {
  banner: {
    android: string;
    ios: string;
  };
  interstitial: {
    android: string;
    ios: string;
  };
}
