import { useEffect, useRef } from 'react';
import { AdMob, InterstitialAdPluginEvents } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { ADMOB_CONFIG } from '@/config/admob';

export const useAppOpenAd = () => {
  const initialized = useRef(false);
  const adLoaded = useRef(false);
  const isShowingAd = useRef(false);
  const lastAdShownTime = useRef<number>(0);

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
          testingDevices: ADMOB_CONFIG.TESTING_DEVICES,
          initializeForTesting: ADMOB_CONFIG.IS_TESTING,
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
          isShowingAd.current = true;
          lastAdShownTime.current = Date.now();
        });

        // Listen for when interstitial fails to show
        await AdMob.addListener(InterstitialAdPluginEvents.FailedToShow, (error) => {
          console.error('❌ App Open ad failed to show:', error);
        });

        // Listen for when interstitial is dismissed
        await AdMob.addListener(InterstitialAdPluginEvents.Dismissed, async () => {
          console.log('ℹ️ App Open ad dismissed');
          isShowingAd.current = false;
          adLoaded.current = false;
          
          // Wait a bit before preparing next ad
          setTimeout(async () => {
            try {
              await AdMob.prepareInterstitial({
                adId: ADMOB_CONFIG.INTERSTITIAL_AD_UNIT_ID,
                isTesting: ADMOB_CONFIG.IS_TESTING,
              });
              console.log('✅ Next App Open ad prepared');
            } catch (error) {
              console.error('❌ Failed to prepare next ad:', error);
            }
          }, 1000);
        });

        // Prepare initial interstitial
        console.log('⏳ Preparing initial App Open ad...');
        await AdMob.prepareInterstitial({
          adId: ADMOB_CONFIG.INTERSTITIAL_AD_UNIT_ID,
          isTesting: ADMOB_CONFIG.IS_TESTING,
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
      console.log(`📊 Ad status - Loaded: ${adLoaded.current}, Showing: ${isShowingAd.current}`);
      
      if (isActive && Capacitor.isNativePlatform()) {
        // Check if enough time has passed since last ad
        const timeSinceLastAd = Date.now() - lastAdShownTime.current;
        console.log(`⏱️ Time since last ad: ${Math.round(timeSinceLastAd / 1000 / 60)} minutes`);
        
        if (isShowingAd.current) {
          console.log('⚠️ Ad is already showing, skipping...');
          return;
        }
        
        if (!adLoaded.current) {
          console.log('⚠️ Ad not loaded yet, preparing new ad...');
          try {
            await AdMob.prepareInterstitial({
              adId: ADMOB_CONFIG.INTERSTITIAL_AD_UNIT_ID,
              isTesting: ADMOB_CONFIG.IS_TESTING,
            });
          } catch (error) {
            console.error('❌ Failed to prepare ad:', error);
          }
          return;
        }
        
        // Skip ad if shown too recently
        if (lastAdShownTime.current > 0 && timeSinceLastAd < ADMOB_CONFIG.MIN_TIME_BETWEEN_ADS_MS) {
          console.log('⏳ Too soon to show another ad (minimum 4 hours between ads)');
          return;
        }
        
        console.log('⏳ Attempting to show App Open ad...');
        try {
          await AdMob.showInterstitial();
          console.log('✅ App Open interstitial ad displayed');
        } catch (error) {
          console.error('❌ Error showing App Open ad:', error);
          // Try to prepare a new ad after failure
          setTimeout(async () => {
            try {
              await AdMob.prepareInterstitial({
                adId: ADMOB_CONFIG.INTERSTITIAL_AD_UNIT_ID,
                isTesting: ADMOB_CONFIG.IS_TESTING,
              });
            } catch (e) {
              console.error('❌ Failed to prepare ad after show failure:', e);
            }
          }, 2000);
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
