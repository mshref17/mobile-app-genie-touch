import { useEffect, useRef, useState } from 'react';
import { AdMob } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';
import { ADMOB_CONFIG } from '@/config/admob';

export const useAdMobInit = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const initAttempted = useRef(false);

  useEffect(() => {
    const initializeAdMob = async () => {
      if (!Capacitor.isNativePlatform()) {
        console.log('AdMob only works on native platforms');
        return;
      }

      if (initAttempted.current) return;
      initAttempted.current = true;

      try {
        await AdMob.initialize({
          testingDevices: [...ADMOB_CONFIG.testingDevices],
          initializeForTesting: ADMOB_CONFIG.testMode,
        });

        setIsInitialized(true);
        console.log('AdMob initialized successfully');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setInitError(errorMessage);
        console.error('Error initializing AdMob:', error);
      }
    };

    initializeAdMob();
  }, []);

  return { isInitialized, initError };
};
