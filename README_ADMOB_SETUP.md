# AdMob Setup Instructions

## Current Status
✅ **Currently using Google's official test AdMob IDs**
- These test ads are safe to use and will show test advertisements
- No revenue will be generated (this is expected for test ads)
- When you're ready for production, follow the steps below

## Configuration

The AdMob configuration is located in `src/config/admob.ts`. Currently using test IDs.

### When Ready for Production:

#### Step 1: Get Your AdMob IDs

1. Go to [AdMob Console](https://apps.admob.com/)
2. Create a new app or select existing app
3. Get your App ID and create an Interstitial Ad Unit
4. Copy the IDs

#### Step 2: Update Configuration

Edit `src/config/admob.ts` and replace the test IDs:

```typescript
export const ADMOB_CONFIG = {
  APP_ID: {
    ios: 'ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX', // Your iOS App ID
    android: 'ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX', // Your Android App ID
  },
  INTERSTITIAL_AD_ID: {
    ios: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX', // Your iOS Interstitial Ad ID
    android: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX', // Your Android Interstitial Ad ID
  },
  USE_TEST_ADS: false, // Set to false for production
};
```

### Step 3: Update Capacitor Configuration

Add your AdMob App ID to `capacitor.config.ts`:

```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.e4d164e326634c4abca4073288a7eff6',
  appName: 'mobile-app-genie-touch',
  webDir: 'dist',
  server: {
    url: "https://e4d164e3-2663-4c4a-bca4-073288a7eff6.lovableproject.com?forceHideBadge=true",
    cleartext: true
  },
  plugins: {
    AdMob: {
      appId: 'ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX', // Your App ID
      testingDevices: ['DEVICE_ID_FOR_TESTING'], // Optional: Add your device ID for testing
    },
  },
};

export default config;
```

### Step 4: Build and Sync

After updating the configuration:

1. Run `npm run build`
2. Run `npx cap sync`
3. Build your app for iOS/Android

## Ad Behavior

- **Frequency**: Ads show every 3 tab switches between Dashboard and Weekly tabs
- **Platform**: Only shows on native mobile platforms (iOS/Android)
- **Testing**: Currently using test ads. Set `USE_TEST_ADS: false` for production

## Customization

You can adjust ad frequency in `src/config/admob.ts`:

```typescript
AD_FREQUENCY: {
  TAB_SWITCH_FREQUENCY: 3, // Change this number to show ads more/less frequently
}
```

## Testing

- Test ads are shown by default
- Real ads will only show when `USE_TEST_ADS` is set to `false` and you're using real Ad IDs
- Use a physical device for testing as ads don't work well in simulators

## Important Notes

1. **App Store Guidelines**: Make sure your ad implementation complies with App Store and Google Play policies
2. **GDPR/Privacy**: Consider implementing consent management if targeting EU users
3. **Revenue**: You'll only earn revenue with real ads and real Ad IDs
4. **Approval**: Your app and ads need to be approved by AdMob before earning revenue