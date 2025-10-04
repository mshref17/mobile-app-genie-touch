// AdMob Configuration
// Update these values with your actual AdMob IDs

export const ADMOB_CONFIG = {
  // Get your App IDs from: https://apps.admob.com/
  appId: {
    android: 'ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX', // Replace with your Android App ID
    ios: 'ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX',     // Replace with your iOS App ID
  },
  
  // Get your Ad Unit IDs from: https://apps.admob.com/
  adUnits: {
    appOpen: {
      android: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX', // Replace with your Android App Open Ad Unit ID
      ios: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX',     // Replace with your iOS App Open Ad Unit ID
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
