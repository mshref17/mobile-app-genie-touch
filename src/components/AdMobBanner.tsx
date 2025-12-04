import { useEffect, useRef } from 'react';
import { AdMob, BannerAdOptions, BannerAdSize, BannerAdPosition } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';
import { ADMOB_CONFIG } from '@/config/admob';

export const AdMobBanner = () => {
  const initialized = useRef(false);

  useEffect(() => {
    const initializeAdMob = async () => {
      if (!Capacitor.isNativePlatform()) {
        console.log('AdMob only works on native platforms');
        return;
      }

      if (initialized.current) return;
      
      try {
        // Initialize AdMob
        await AdMob.initialize({
          testingDevices: ADMOB_CONFIG.TESTING_DEVICES,
          initializeForTesting: ADMOB_CONFIG.IS_TESTING,
        });

        initialized.current = true;

        // Show banner ad below header, above tabs
        const options: BannerAdOptions = {
          adId: ADMOB_CONFIG.BANNER_AD_UNIT_ID,
          adSize: BannerAdSize.BANNER,
          position: BannerAdPosition.TOP_CENTER,
          margin: 52,
          isTesting: ADMOB_CONFIG.IS_TESTING,
        };

        await AdMob.showBanner(options);
        console.log('AdMob banner shown successfully');
      } catch (error) {
        console.error('Error initializing AdMob:', error);
      }
    };

    initializeAdMob();

    // Cleanup
    return () => {
      if (Capacitor.isNativePlatform() && initialized.current) {
        AdMob.removeBanner().catch(console.error);
      }
    };
  }, []);

  // Show placeholder on web
  if (!Capacitor.isNativePlatform()) {
    return (
      <div className="bg-white/30 dark:bg-white/10 border-b border-white/30 flex items-center justify-center h-[50px]">
        <span className="text-xs text-white/90 dark:text-white/70">AdMob Banner (Native Only)</span>
      </div>
    );
  }

  // On native, the banner is shown by AdMob SDK
  return <div className="h-[50px]" />;
};
