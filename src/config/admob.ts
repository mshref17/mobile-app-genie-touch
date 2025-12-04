// AdMob Configuration
// Replace these with your production AdMob IDs before releasing

export const ADMOB_CONFIG = {
  // AdMob App ID (configured in capacitor.config.ts and AndroidManifest.xml)
  APP_ID: 'ca-app-pub-3940256099942544~3347511713',
  
  // Ad Unit IDs
  BANNER_AD_UNIT_ID: 'ca-app-pub-3940256099942544/6300978111',
  INTERSTITIAL_AD_UNIT_ID: 'ca-app-pub-3940256099942544/1033173712',
  
  // Testing configuration
  IS_TESTING: true,
  TESTING_DEVICES: ['YOUR_DEVICE_ID'],
  
  // App Open Ad settings
  MIN_TIME_BETWEEN_ADS_MS: 4 * 60 * 60 * 1000, // 4 hours
};
