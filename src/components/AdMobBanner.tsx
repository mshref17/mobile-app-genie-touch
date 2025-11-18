import { useEffect, useRef } from 'react';
import { AdMob, BannerAdOptions, BannerAdSize, BannerAdPosition } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';

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
          testingDevices: ['YOUR_DEVICE_ID'],
          initializeForTesting: true,
        });

        initialized.current = true;

        // Show banner ad - positioned below header
        const options: BannerAdOptions = {
          adId: 'ca-app-pub-3940256099942544/6300978111', // Test Banner Ad Unit ID
          adSize: BannerAdSize.BANNER,
          position: BannerAdPosition.TOP_CENTER,
          margin: 56, // Push down below the header (logo + settings)
          isTesting: true,
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
