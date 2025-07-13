// AdMob Configuration with Google's Official Test IDs
export const ADMOB_CONFIG = {
  // Google's official test App IDs
  APP_ID: {
    ios: 'ca-app-pub-3940256099942544~1458002511', // Google Test App ID for iOS
    android: 'ca-app-pub-3940256099942544~3347511713', // Google Test App ID for Android
  },
  INTERSTITIAL_AD_ID: {
    ios: 'ca-app-pub-3940256099942544/4411468910', // Google Test Interstitial Ad ID for iOS
    android: 'ca-app-pub-3940256099942544/1033173712', // Google Test Interstitial Ad ID for Android
  },
  // Using test ads - change to false when you add your real AdMob IDs
  USE_TEST_ADS: true,
  // Ad frequency settings
  AD_FREQUENCY: {
    // Show ad every X tab switches - set to 1 for testing
    TAB_SWITCH_FREQUENCY: 1,
  }
};

// Helper function to get the correct ad ID based on platform
export const getInterstitialAdId = (platform: 'ios' | 'android') => {
  return ADMOB_CONFIG.INTERSTITIAL_AD_ID[platform];
};

export const getAppId = (platform: 'ios' | 'android') => {
  return ADMOB_CONFIG.APP_ID[platform];
};