import { useEffect, useState, useRef } from 'react';
import { AdMob, InterstitialAdPluginEvents } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { getAdId, ADMOB_CONFIG } from '@/config/admob';

export const useAppOpenAd = (isAdMobInitialized: boolean) => {
  const [adLoaded, setAdLoaded] = useState(false);
  const lastAdShownTime = useRef<number>(0);
  const appStartTime = useRef<number>(Date.now());
  const listenersSetup = useRef(false);

  useEffect(() => {
    if (!Capacitor.isNativePlatform() || !isAdMobInitialized) {
      return;
    }

    const setupAppOpenAd = async () => {
      if (listenersSetup.current) return;
      listenersSetup.current = true;

      try {
        // Listen for when ad is loaded
        const loadedListener = await AdMob.addListener(
          InterstitialAdPluginEvents.Loaded,
          () => {
            setAdLoaded(true);
            console.log('App Open ad loaded successfully');
          }
        );

        // Listen for when ad fails to load
        const failedListener = await AdMob.addListener(
          InterstitialAdPluginEvents.FailedToLoad,
          (error) => {
            console.error('App Open ad failed to load:', error);
            setAdLoaded(false);
            // Retry loading after 30 seconds
            setTimeout(() => {
              prepareAppOpenAd();
            }, 30000);
          }
        );

        // Listen for when ad is dismissed
        const dismissedListener = await AdMob.addListener(
          InterstitialAdPluginEvents.Dismissed,
          () => {
            setAdLoaded(false);
            console.log('App Open ad dismissed');
            // Preload next ad
            prepareAppOpenAd();
          }
        );

        // Prepare initial ad
        await prepareAppOpenAd();

        // Cleanup listeners on unmount
        return () => {
          loadedListener.remove();
          failedListener.remove();
          dismissedListener.remove();
        };
      } catch (error) {
        console.error('Error setting up App Open ad:', error);
      }
    };

    const prepareAppOpenAd = async () => {
      try {
        await AdMob.prepareInterstitial({
          adId: getAdId('appOpen'),
          isTesting: ADMOB_CONFIG.testMode,
        });
        console.log('App Open ad prepared');
      } catch (error) {
        console.error('Error preparing App Open ad:', error);
      }
    };

    const cleanup = setupAppOpenAd();

    // Show ad on initial app start after cold start delay
    const initialAdTimer = setTimeout(async () => {
      if (!adLoaded) {
        console.log('App Open ad not loaded yet on initial start');
        return;
      }

      const now = Date.now();
      const timeSinceLastAd = now - lastAdShownTime.current;

      // Check frequency capping
      if (timeSinceLastAd < ADMOB_CONFIG.appOpenAd.minIntervalMs) {
        console.log('App Open ad skipped on initial start: too soon since last ad');
        return;
      }

      try {
        await AdMob.showInterstitial();
        lastAdShownTime.current = now;
        console.log('App Open ad shown on initial start');
      } catch (error) {
        console.error('Error showing App Open ad on initial start:', error);
      }
    }, ADMOB_CONFIG.appOpenAd.minColdStartDelayMs);

    // Show ad when app comes to foreground
    const appStateListener = CapApp.addListener('appStateChange', async ({ isActive }) => {
      if (!isActive || !adLoaded) {
        console.log(`App Open ad check: isActive=${isActive}, adLoaded=${adLoaded}`);
        return;
      }

      const now = Date.now();
      const timeSinceLastAd = now - lastAdShownTime.current;
      const timeSinceAppStart = now - appStartTime.current;

      console.log(`App Open ad timing: timeSinceLastAd=${timeSinceLastAd}ms, timeSinceAppStart=${timeSinceAppStart}ms`);

      // Check frequency capping
      if (timeSinceLastAd < ADMOB_CONFIG.appOpenAd.minIntervalMs) {
        console.log('App Open ad skipped: too soon since last ad');
        return;
      }

      // Check cold start delay
      if (timeSinceAppStart < ADMOB_CONFIG.appOpenAd.minColdStartDelayMs) {
        console.log('App Open ad skipped: too soon after app start');
        return;
      }

      try {
        await AdMob.showInterstitial();
        lastAdShownTime.current = now;
        console.log('App Open ad shown on foreground');
      } catch (error) {
        console.error('Error showing App Open ad:', error);
      }
    });

    return () => {
      clearTimeout(initialAdTimer);
      cleanup?.then((cleanupFn) => cleanupFn?.());
      appStateListener.then((listener) => listener.remove());
    };
  }, [isAdMobInitialized]);

  return { adLoaded };
};
