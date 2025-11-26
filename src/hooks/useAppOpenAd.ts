import { useEffect, useRef } from 'react';
import { AdMob, InterstitialAdPluginEvents } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';

export const useAppOpenAd = () => {
  const initialized = useRef(false);
  const adLoaded = useRef(false);

  useEffect(() => {
    const initializeAppOpenAd = async () => {
      if (!Capacitor.isNativePlatform()) {
        console.log('App Open ads only work on native platforms');
        return;
      }

      if (initialized.current) return;

      try {
        // Initialize AdMob if not already done
        await AdMob.initialize({
          testingDevices: ['YOUR_DEVICE_ID'],
          initializeForTesting: true,
        });

        console.log('✅ AdMob initialized for App Open ads');
        initialized.current = true;

        // Listen for when interstitial fails to load
        await AdMob.addListener(InterstitialAdPluginEvents.FailedToLoad, (error) => {
          console.error('❌ App Open ad failed to load:', error);
          adLoaded.current = false;
        });

        // Listen for when interstitial is loaded
        await AdMob.addListener(InterstitialAdPluginEvents.Loaded, () => {
          adLoaded.current = true;
          console.log('✅ App Open interstitial ad loaded successfully');
        });

        // Listen for when interstitial is shown
        await AdMob.addListener(InterstitialAdPluginEvents.Showed, () => {
          console.log('✅ App Open ad is now showing');
        });

        // Listen for when interstitial fails to show
        await AdMob.addListener(InterstitialAdPluginEvents.FailedToShow, (error) => {
          console.error('❌ App Open ad failed to show:', error);
        });

        // Listen for when interstitial is dismissed
        await AdMob.addListener(InterstitialAdPluginEvents.Dismissed, async () => {
          console.log('ℹ️ App Open ad dismissed');
          adLoaded.current = false;
          // Preload next ad
          try {
            await AdMob.prepareInterstitial({
              adId: 'ca-app-pub-3940256099942544/1033173712', // Test Interstitial Ad Unit ID
              isTesting: true,
            });
            console.log('✅ Next App Open ad prepared');
          } catch (error) {
            console.error('❌ Failed to prepare next ad:', error);
          }
        });

        // Prepare initial interstitial
        console.log('⏳ Preparing initial App Open ad...');
        await AdMob.prepareInterstitial({
          adId: 'ca-app-pub-3940256099942544/1033173712', // Test Interstitial Ad Unit ID
          isTesting: true,
        });
        console.log('✅ Initial App Open interstitial ad prepared');

      } catch (error) {
        console.error('❌ Error with App Open ad initialization:', error);
      }
    };

    initializeAppOpenAd();

    // Show ad when app comes to foreground
    let appStateListener: any;
    
    CapApp.addListener('appStateChange', async ({ isActive }) => {
      console.log(`📱 App state changed: ${isActive ? 'ACTIVE (foreground)' : 'INACTIVE (background)'}`);
      console.log(`📊 Ad loaded status: ${adLoaded.current}`);
      
      if (isActive && adLoaded.current && Capacitor.isNativePlatform()) {
        console.log('⏳ Attempting to show App Open ad...');
        try {
          await AdMob.showInterstitial();
          console.log('✅ App Open interstitial ad displayed');
        } catch (error) {
          console.error('❌ Error showing App Open ad on resume:', error);
        }
      } else if (isActive && !adLoaded.current) {
        console.log('⚠️ App became active but ad not loaded yet');
      }
    }).then(listener => {
      appStateListener = listener;
    });

    return () => {
      if (appStateListener) {
        appStateListener.remove();
      }
    };
  }, []);
};
