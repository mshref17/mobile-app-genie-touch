export const ADMOB_CONFIG = {
  // Test mode - set to false for production
  testMode: true,
  
  // Test device IDs
  testingDevices: ['YOUR_DEVICE_ID'],
  
  // Ad Unit IDs
  adIds: {
    banner: {
      test: 'ca-app-pub-3940256099942544/6300978111',
      production: 'YOUR_PRODUCTION_BANNER_AD_ID',
    },
    appOpen: {
      test: 'ca-app-pub-3940256099942544/1033173712',
      production: 'YOUR_PRODUCTION_APP_OPEN_AD_ID',
    },
  },
  
  // App Open ad settings
  appOpenAd: {
    // Minimum time between showing ads (in milliseconds)
    minIntervalMs: 4 * 60 * 60 * 1000, // 4 hours
    // Minimum time after cold start before showing ad (in milliseconds)
    minColdStartDelayMs: 3000, // 3 seconds
  },
} as const;

// Helper to get the correct ad ID based on test mode
export const getAdId = (adType: 'banner' | 'appOpen'): string => {
  return ADMOB_CONFIG.testMode 
    ? ADMOB_CONFIG.adIds[adType].test 
    : ADMOB_CONFIG.adIds[adType].production;
};
