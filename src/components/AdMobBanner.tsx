import { useEffect, useRef } from 'react';
import { AdMob, BannerAdOptions, BannerAdSize, BannerAdPosition } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';

const AdMobBanner = () => {
  const bannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      // Show placeholder on web for testing
      return;
    }

    const initializeAdMob = async () => {
      try {
        await AdMob.initialize({
          testingDevices: ['YOUR_TESTING_DEVICE_ID'],
          initializeForTesting: true,
        });

        const options: BannerAdOptions = {
          adId: Capacitor.getPlatform() === 'ios' 
            ? 'ca-app-pub-3940256099942544/2934735716' // iOS test banner
            : 'ca-app-pub-3940256099942544/6300978111', // Android test banner
          adSize: BannerAdSize.BANNER,
          position: BannerAdPosition.TOP_CENTER,
          margin: 0,
          isTesting: true,
        };

        await AdMob.showBanner(options);
      } catch (error) {
        console.error('AdMob initialization error:', error);
      }
    };

    initializeAdMob();

    return () => {
      if (Capacitor.isNativePlatform()) {
        AdMob.hideBanner().catch(console.error);
      }
    };
  }, []);

  // Show placeholder banner on web for development
  if (!Capacitor.isNativePlatform()) {
    return (
      <div 
        ref={bannerRef}
        className="w-full h-[50px] bg-border/50 flex items-center justify-center text-muted-foreground text-sm border-b"
      >
        AdMob Banner (Test Mode - Web Preview)
      </div>
    );
  }

  // On native platforms, AdMob handles the banner display
  return <div className="h-[50px] w-full" />;
};

export default AdMobBanner;