import { useEffect, useState } from 'react';
import { AdMob, BannerAdOptions, BannerAdSize, BannerAdPosition } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';
import { admobConfig } from '@/config/admob';

export function AdMobBanner() {
  const [isAdLoaded, setIsAdLoaded] = useState(false);

  useEffect(() => {
    const initializeAdMob = async () => {
      try {
        // Initialize AdMob
        await AdMob.initialize({
          testingDevices: ['YOUR_TESTING_DEVICE_ID'], // Add your device ID for testing
          initializeForTesting: !admobConfig.isProduction,
        });

        // Show banner ad
        const bannerOptions: BannerAdOptions = {
          adId: admobConfig.bannerAdUnitId,
          adSize: admobConfig.bannerOptions.adSize as BannerAdSize,
          position: admobConfig.bannerOptions.position as BannerAdPosition,
          margin: admobConfig.bannerOptions.margin,
        };

        await AdMob.showBanner(bannerOptions);
        setIsAdLoaded(true);
      } catch (error) {
        console.error('AdMob initialization failed:', error);
      }
    };

    // Only initialize on mobile platforms
    if (Capacitor.isNativePlatform()) {
      initializeAdMob();
    }

    // Cleanup function to hide banner when component unmounts
    return () => {
      if (Capacitor.isNativePlatform()) {
        AdMob.hideBanner().catch(console.error);
      }
    };
  }, []);

  // Return a placeholder div for web development
  if (!Capacitor.isNativePlatform()) {
    return (
      <div className="w-full h-12 bg-muted/50 flex items-center justify-center border-b">
        <span className="text-xs text-muted-foreground">AdMob Banner (Mobile Only)</span>
      </div>
    );
  }

  // Return empty div on mobile as the banner is handled natively
  return isAdLoaded ? <div className="h-12 w-full" /> : null;
}