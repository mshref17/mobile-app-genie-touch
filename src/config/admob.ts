// AdMob Configuration
// Replace these with your production AdMob IDs before releasing

export const ADMOB_CONFIG = {
  // AdMob App ID (configured in capacitor.config.ts and AndroidManifest.xml)
  APP_ID: 'ca-app-pub-9774872560845243~9690105991',
  
  // Ad Unit IDs
  BANNER_AD_UNIT_ID: 'ca-app-pub-9774872560845243/7519461931',
  INTERSTITIAL_AD_UNIT_ID: 'ca-app-pub-9774872560845243/2666396986',
  
  // Testing configuration
  IS_TESTING: true,
  TESTING_DEVICES: ['YOUR_DEVICE_ID'],
  
  // App Open Ad settings
  MIN_TIME_BETWEEN_ADS_MS: 4 * 60 * 60 * 1000, // 4 hours
};
