
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.e4d164e326634c4abca4073288a7eff6',
  appName: 'ايامي',
  webDir: 'dist',
  bundledWebRuntime: false,
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    },
    AdMob: {
      appId: "ca-app-pub-9774872560845243~9690105991", // Test App ID
      testingDevices: ["YOUR_DEVICE_ID"]
    }
  }
};

export default config;
