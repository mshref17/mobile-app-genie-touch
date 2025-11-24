
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.e4d164e326634c4abca4073288a7eff6',
  appName: 'دليل المرأة',
  webDir: 'dist',
  bundledWebRuntime: false,
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    },
    AdMob: {
      appId: "ca-app-pub-3940256099942544~3347511713", // Test App ID
      testingDevices: ["YOUR_DEVICE_ID"]
    }
  }
};

export default config;
