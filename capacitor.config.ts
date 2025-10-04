
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
      appId: 'ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX', // Replace with your actual App ID
      testingDevices: [], // Add device IDs for testing
    }
  }
};

export default config;
