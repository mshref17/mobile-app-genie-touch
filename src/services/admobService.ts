import { AdMob, InterstitialAdPluginEvents, AdLoadInfo, AdMobError } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';
import { ADMOB_CONFIG, getInterstitialAdId } from '@/config/admob';

class AdMobService {
  private isAdLoaded = false;
  private tabSwitchCount = 0;
  private isInitialized = false;

  async initialize(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      console.log('AdMob: Not running on native platform, skipping initialization');
      return false;
    }

    try {
      await AdMob.initialize({
        testingDevices: ADMOB_CONFIG.USE_TEST_ADS ? ['DEVICE_ID_EMULATOR'] : [],
        initializeForTesting: ADMOB_CONFIG.USE_TEST_ADS,
      });

      this.isInitialized = true;
      console.log('AdMob initialized successfully');
      
      // Pre-load the first interstitial ad
      await this.loadInterstitialAd();
      
      return true;
    } catch (error) {
      console.error('AdMob initialization failed:', error);
      return false;
    }
  }

  private async loadInterstitialAd(): Promise<void> {
    if (!this.isInitialized || !Capacitor.isNativePlatform()) {
      return;
    }

    try {
      const platform = Capacitor.getPlatform() as 'ios' | 'android';
      const adId = getInterstitialAdId(platform);

      // Add event listeners
      AdMob.addListener(InterstitialAdPluginEvents.Loaded, (info: AdLoadInfo) => {
        console.log('Interstitial ad loaded', info);
        this.isAdLoaded = true;
      });

      AdMob.addListener(InterstitialAdPluginEvents.Dismissed, () => {
        console.log('Interstitial ad dismissed');
        this.isAdLoaded = false;
        // Pre-load the next ad
        this.loadInterstitialAd();
      });

      AdMob.addListener(InterstitialAdPluginEvents.FailedToLoad, (error: AdMobError) => {
        console.error('Interstitial ad failed to load:', error);
        this.isAdLoaded = false;
      });

      AdMob.addListener(InterstitialAdPluginEvents.FailedToShow, (error: AdMobError) => {
        console.error('Interstitial ad failed to show:', error);
        this.isAdLoaded = false;
      });

      // Load the ad
      await AdMob.prepareInterstitial({
        adId: adId,
      });
    } catch (error) {
      console.error('Failed to load interstitial ad:', error);
      this.isAdLoaded = false;
    }
  }

  async showInterstitialOnTabSwitch(): Promise<void> {
    if (!this.isInitialized || !Capacitor.isNativePlatform()) {
      return;
    }

    this.tabSwitchCount++;

    // Show ad based on frequency setting
    if (this.tabSwitchCount >= ADMOB_CONFIG.AD_FREQUENCY.TAB_SWITCH_FREQUENCY) {
      await this.showInterstitialAd();
      this.tabSwitchCount = 0; // Reset counter
    }
  }

  private async showInterstitialAd(): Promise<void> {
    if (!this.isAdLoaded) {
      console.log('Interstitial ad not ready to show');
      return;
    }

    try {
      await AdMob.showInterstitial();
    } catch (error) {
      console.error('Failed to show interstitial ad:', error);
    }
  }

  // Method to manually show ad (for testing)
  async forceShowAd(): Promise<void> {
    await this.showInterstitialAd();
  }

  // Method to reset tab switch counter
  resetTabCounter(): void {
    this.tabSwitchCount = 0;
  }

  // Cleanup method
  cleanup(): void {
    // Note: AdMob plugin doesn't have removeAllListeners method
    // Listeners will be automatically cleaned up when the app is destroyed
    console.log('AdMob cleanup called');
  }
}

// Export singleton instance
export const admobService = new AdMobService();