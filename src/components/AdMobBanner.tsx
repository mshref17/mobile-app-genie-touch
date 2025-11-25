import { useEffect, useRef } from 'react';
import { AdMob, BannerAdOptions, BannerAdSize, BannerAdPosition } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';
import { getAdId, ADMOB_CONFIG } from '@/config/admob';

interface AdMobBannerProps {
  isAdMobInitialized: boolean;
}

export const AdMobBanner = ({ isAdMobInitialized }: AdMobBannerProps) => {
  const bannerShown = useRef(false);

  useEffect(() => {
    const showBanner = async () => {
      if (!Capacitor.isNativePlatform() || !isAdMobInitialized || bannerShown.current) {
        return;
      }

      bannerShown.current = true;
      
      try {
        const options: BannerAdOptions = {
          adId: getAdId('banner'),
          adSize: BannerAdSize.BANNER,
          position: BannerAdPosition.TOP_CENTER,
          margin: 110,
          isTesting: ADMOB_CONFIG.testMode,
        };

        await AdMob.showBanner(options);
        console.log('AdMob banner shown successfully');
      } catch (error) {
        console.error('Error showing AdMob banner:', error);
        bannerShown.current = false;
      }
    };

    showBanner();

    // Cleanup
    return () => {
      if (Capacitor.isNativePlatform() && bannerShown.current) {
        AdMob.removeBanner().catch(console.error);
      }
    };
  }, [isAdMobInitialized]);

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
