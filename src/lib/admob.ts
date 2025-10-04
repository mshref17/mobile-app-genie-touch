import { AdMob, AdMobError, AdOptions, AdLoadInfo } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';
import { ADMOB_CONFIG, getAppOpenAdUnitId } from '@/config/admob.config';

export class AdMobService {
  private static isInitialized = false;
  private static isAdLoaded = false;
  private static isAdShowing = false;

  static async initialize() {
    if (this.isInitialized) return;
    
    // Only initialize on native platforms
    if (!Capacitor.isNativePlatform()) {
      console.log('AdMob: Skipping initialization on web platform');
      return;
    }

    try {
      await AdMob.initialize({
        testingDevices: ADMOB_CONFIG.testMode ? ADMOB_CONFIG.testDeviceIds : [],
        initializeForTesting: ADMOB_CONFIG.testMode,
      });

      this.isInitialized = true;
      console.log('AdMob initialized successfully');

      // Pre-load the first ad
      await this.loadAppOpenAd();
    } catch (error) {
      console.error('AdMob initialization failed:', error);
    }
  }

  static async loadAppOpenAd() {
    if (!Capacitor.isNativePlatform() || !this.isInitialized) {
      return;
    }

    try {
      const adUnitId = getAppOpenAdUnitId();
      const options: AdOptions = {
        adId: adUnitId,
      };
      
      await AdMob.prepareInterstitial(options);
      this.isAdLoaded = true;
      console.log('App Open Ad prepared');
    } catch (error) {
      console.error('Failed to prepare App Open Ad:', error);
      this.isAdLoaded = false;
    }
  }

  static async showAppOpenAd() {
    if (!Capacitor.isNativePlatform() || !this.isInitialized) {
      console.log('AdMob: Cannot show ad on web platform');
      return false;
    }

    if (this.isAdShowing) {
      console.log('Ad is already showing');
      return false;
    }

    if (!this.isAdLoaded) {
      console.log('Ad is not loaded yet, loading now...');
      await this.loadAppOpenAd();
      // Wait a bit for the ad to load
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    try {
      await AdMob.showInterstitial();
      this.isAdShowing = true;
      
      // Reset state after showing
      setTimeout(() => {
        this.isAdShowing = false;
        this.isAdLoaded = false;
        // Pre-load the next ad
        this.loadAppOpenAd();
      }, 1000);
      
      return true;
    } catch (error) {
      console.error('Failed to show App Open Ad:', error);
      this.isAdShowing = false;
      this.isAdLoaded = false;
      return false;
    }
  }
}
