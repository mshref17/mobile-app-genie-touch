# AdMob Integration Setup Guide

## Overview
Your app is now configured to show app open ads using Google AdMob. The ad appears after the splash screen when users open the app.

## Configuration Files to Update

### 1. AdMob Config (`src/config/admob.config.ts`)
Replace the placeholder IDs with your actual AdMob IDs:

```typescript
export const ADMOB_CONFIG = {
  appId: {
    android: 'ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX', // Your Android App ID
    ios: 'ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX',     // Your iOS App ID
  },
  
  adUnits: {
    appOpen: {
      android: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX', // Your Android App Open Ad Unit ID
      ios: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX',     // Your iOS App Open Ad Unit ID
    }
  },
  
  testMode: true, // Set to false for production
  testDeviceIds: [], // Add test device IDs if needed
};
```

### 2. Capacitor Config (`capacitor.config.ts`)
Update the AdMob plugin configuration with your App ID:

```typescript
AdMob: {
  appId: 'ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX', // Your App ID
  testingDevices: [], // Add device IDs for testing
}
```

## Where to Find Your AdMob IDs

1. **App ID**: 
   - Go to https://apps.admob.com/
   - Select your app
   - Find "App ID" in the app settings
   - Format: `ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX`

2. **Ad Unit ID**:
   - In your AdMob app, go to "Ad units"
   - Find your "App open" ad unit
   - Copy the Ad unit ID
   - Format: `ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX`

## Testing

### Before Publishing (Test Mode)
- Keep `testMode: true` in `src/config/admob.config.ts`
- This shows test ads to avoid policy violations

### Production Release
1. Set `testMode: false` in `src/config/admob.config.ts`
2. Make sure your AdMob account is approved
3. Ensure your app complies with AdMob policies

## How It Works

1. **Initialization**: AdMob initializes when the app starts
2. **Pre-loading**: The first ad loads in the background
3. **Display**: Ad shows after the 2-second splash screen
4. **Auto-reload**: After an ad is shown/dismissed, the next ad is pre-loaded

## Deployment Steps

After updating the configuration:

1. **Export to GitHub**: Use the "Export to Github" button in Lovable
2. **Pull the code**: `git pull` in your local repository
3. **Install dependencies**: `npm install`
4. **Add platforms** (if not already added):
   ```bash
   npx cap add android
   npx cap add ios
   ```
5. **Sync native code**:
   ```bash
   npx cap sync
   ```
6. **Run on device/emulator**:
   ```bash
   npx cap run android
   # or
   npx cap run ios
   ```

## Troubleshooting

- **Ad not showing**: Check console logs for AdMob initialization errors
- **Web platform**: Ads only work on native platforms (Android/iOS), not in browser
- **Test ads**: Make sure `testMode: true` during development
- **Production ads**: Ensure your AdMob account is fully approved before setting `testMode: false`

## Notes

- App open ads work best on cold app starts
- The ad frequency is managed by AdMob's smart frequency capping
- Make sure to comply with Google's AdMob policies
