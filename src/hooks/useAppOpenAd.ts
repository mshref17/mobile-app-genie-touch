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

        initialized.current = true;

        // Listen for when interstitial is loaded
        await AdMob.addListener(InterstitialAdPluginEvents.Loaded, () => {
          adLoaded.current = true;
          console.log('App Open interstitial ad loaded');
        });

        // Listen for when interstitial is dismissed
        await AdMob.addListener(InterstitialAdPluginEvents.Dismissed, async () => {
          adLoaded.current = false;
          // Preload next ad
          await AdMob.prepareInterstitial({
            adId: 'ca-app-pub-3940256099942544/1033173712', // Test Interstitial Ad Unit ID
            isTesting: true,
          });
        });

        // Prepare initial interstitial
        await AdMob.prepareInterstitial({
          adId: 'ca-app-pub-3940256099942544/1033173712', // Test Interstitial Ad Unit ID
          isTesting: true,
        });
        console.log('App Open interstitial ad prepared');

      } catch (error) {
        console.error('Error with App Open ad:', error);
      }
    };

    initializeAppOpenAd();

    // Show ad when app comes to foreground
    let appStateListener: any;
    
    CapApp.addListener('appStateChange', async ({ isActive }) => {
      if (isActive && adLoaded.current && Capacitor.isNativePlatform()) {
        try {
          await AdMob.showInterstitial();
          console.log('App Open interstitial ad shown');
        } catch (error) {
          console.error('Error showing App Open ad on resume:', error);
        }
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
