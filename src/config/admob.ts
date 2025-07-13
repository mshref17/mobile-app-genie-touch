// AdMob Configuration
export const ADMOB_CONFIG = {
  // Replace with your actual AdMob IDs when ready
  APP_ID: {
    ios: 'ca-app-pub-3940256099942544~1458002511', // Test App ID for iOS
    android: 'ca-app-pub-3940256099942544~3347511713', // Test App ID for Android
  },
  INTERSTITIAL_AD_ID: {
    ios: 'ca-app-pub-3940256099942544/4411468910', // Test Interstitial Ad ID for iOS
    android: 'ca-app-pub-3940256099942544/1033173712', // Test Interstitial Ad ID for Android
  },
  // Set to true to use test ads, false for production
  USE_TEST_ADS: true,
  // Ad frequency settings
  AD_FREQUENCY: {
    // Show ad every X tab switches
    TAB_SWITCH_FREQUENCY: 3,
  }
};

// Helper function to get the correct ad ID based on platform
export const getInterstitialAdId = (platform: 'ios' | 'android') => {
  return ADMOB_CONFIG.INTERSTITIAL_AD_ID[platform];
};

export const getAppId = (platform: 'ios' | 'android') => {
  return ADMOB_CONFIG.APP_ID[platform];
};