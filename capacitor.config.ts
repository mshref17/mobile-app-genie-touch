
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.e4d164e326634c4abca4073288a7eff6',
  appName: 'mobile-app-genie-touch',
  webDir: 'dist',
  server: {
    url: 'https://e4d164e3-2663-4c4a-bca4-073288a7eff6.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    }
  }
};

export default config;
