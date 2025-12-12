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


# TO Publish a new apk
Change `versionCode` and name in `build.gradle` file.
go to android directory /android
then run the command `./gradlew bundleRelease`

keystore password is the one is mms*****85
key.properties file has the keystore file path

###########Mohammad ##########
to build changes and run for android
npm run build

then sync android
npx cap sync android

then run the app
npx cap run android
