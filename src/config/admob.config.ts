// AdMob Configuration
// Update these values with your actual AdMob IDs

export const ADMOB_CONFIG = {
  // Get your App IDs from: https://apps.admob.com/
  appId: {
    android: 'ca-app-pub-6789336355455489~9928832695',
    ios: 'ca-app-pub-6789336355455489~9928832695',
  },
  
  // Get your Ad Unit IDs from: https://apps.admob.com/
  adUnits: {
    appOpen: {
      android: 'ca-app-pub-6789336355455489/4513558758',
      ios: 'ca-app-pub-6789336355455489/4513558758',
    }
  },
  
  // Test mode - set to false for production
  testMode: true,
  
  // Test device IDs (optional, for testing on specific devices)
  testDeviceIds: [],
};

// Helper to get platform-specific IDs
export const getAdMobAppId = () => {
  const platform = (window as any).Capacitor?.getPlatform() || 'web';
  return platform === 'android' ? ADMOB_CONFIG.appId.android : ADMOB_CONFIG.appId.ios;
};

export const getAppOpenAdUnitId = () => {
  const platform = (window as any).Capacitor?.getPlatform() || 'web';
  return platform === 'android' ? ADMOB_CONFIG.adUnits.appOpen.android : ADMOB_CONFIG.adUnits.appOpen.ios;
};
