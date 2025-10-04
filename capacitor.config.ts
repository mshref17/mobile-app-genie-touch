
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.e4d164e326634c4abca4073288a7eff6',
  appName: 'mobile-app-genie-touch',
  webDir: 'dist',
  bundledWebRuntime: false,
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    },
    AdMob: {
      appId: 'ca-app-pub-6789336355455489~9928832695',
      testingDevices: [],
    }
  }
};

export default config;
