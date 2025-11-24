import { useEffect } from 'react';
import { AdMob, AdOptions } from '@capacitor-community/admob';
import { App } from '@capacitor/app';

const APP_OPEN_AD_UNIT_ID = 'ca-app-pub-3940256099942544/9257395921'; // Test ad unit ID

export const useAppOpenAd = () => {
  useEffect(() => {
    let isAdShowing = false;

    const initializeAdMob = async () => {
      try {
        await AdMob.initialize({
          testingDevices: ['YOUR_DEVICE_ID_HERE'],
          initializeForTesting: true,
        });
        console.log('AdMob initialized');
      } catch (error) {
        console.error('Error initializing AdMob:', error);
      }
    };

    const prepareAppOpenAd = async () => {
      try {
        const options: AdOptions = {
          adId: APP_OPEN_AD_UNIT_ID,
          isTesting: true,
        };
        await AdMob.prepareInterstitial(options);
        console.log('App Open Ad prepared');
      } catch (error) {
        console.error('Error preparing App Open Ad:', error);
      }
    };

    const showAppOpenAd = async () => {
      if (isAdShowing) return;
      
      try {
        isAdShowing = true;
        await AdMob.showInterstitial();
        console.log('App Open Ad shown');
      } catch (error) {
        console.error('Error showing App Open Ad:', error);
      } finally {
        isAdShowing = false;
        // Prepare next ad
        prepareAppOpenAd();
      }
    };

    // Initialize AdMob and prepare the first ad
    initializeAdMob().then(() => {
      prepareAppOpenAd();
    });

    // Show ad when app comes to foreground
    App.addListener('appStateChange', ({ isActive }) => {
      if (isActive) {
        showAppOpenAd();
      }
    });

    return () => {
      // Cleanup is handled by Capacitor
    };
  }, []);
};
