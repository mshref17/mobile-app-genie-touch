The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev

To run a change in (Android) device/emulator not locally
npm run build
Then
npx cap sync android
Then run
npx cap run android

# TO Publish a new apk
Change `versionCode` and name in `build.gradle` file.
go to android directory /android
./gradlew bundleRelease

keystore password is the one is mms*****85
key.properties file has the keystore file path
