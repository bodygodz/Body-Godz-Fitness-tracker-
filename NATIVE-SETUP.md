# Curly Gurl Fitness on iPhone and Android

The website is unchanged. People who open it in a browser still see “Needs the phone app (coming soon)” on Apple Watch, Wear OS, and Samsung, and they can still type steps, heart rate, and sleep by hand.

The phone apps live in the `native` folder. The app name is Curly Gurl Fitness. The bundle id and Android package name are `com.curlygurl.fitness`. GitHub Pages keeps serving the files at the root of the repository. This work does not change `main` and does not publish the site.

## What the phone app does

On the phone, Apps & Devices shows a Connect button for Apple Watch / Apple Health, Android / Wear OS (Health Connect), and Samsung Galaxy Watch. Connect asks for permission, then reads the last 14 days of:

- steps
- workouts
- active calories
- heart rate
- sleep
- weight

Steps go on the diary step line. Workouts go in that day’s workout notes. Active calories, heart rate, and sleep go on that day’s diary note. Sleep hours are also saved with the member’s sleep list. Weight is saved in pounds on the weight log. When the member is a linked client, that weight also uses the same weigh-in save the diary already uses. The connection status is saved on the member’s profile with the same profile update the Devices screen already uses. The app does not write readings back to Apple Health or Health Connect, and it does not put those numbers into meal calories.

Samsung Galaxy Watch is read through Health Connect after Samsung Health shares into Health Connect. There is no separate Samsung login in the app.

Strava, Garmin, Fitbit, Oura, and WHOOP are unchanged.

## Apple Developer account

1. Enroll in the Apple Developer Program at [developer.apple.com](https://developer.apple.com). The fee is $99 per year.
2. Register the App ID `com.curlygurl.fitness`.
3. Turn on the HealthKit capability for that App ID. The project already points at `native/ios/App/App/App.entitlements`, which includes HealthKit and does not request clinical health records.
4. The permission text is already in `native/ios/App/App/Info.plist`. One sentence covers reading steps, workouts, active calories, heart rate, sleep, and weight. The second sentence tells Apple the app does not add or change Apple Health readings. Apple still requires that second sentence because the app uses HealthKit.

You do not need a Mac to run the unsigned compile in GitHub Actions. You do need this Apple account before TestFlight or the App Store will accept a build. A signed upload still needs the certificate and profile described below. Those can be created from a Mac, or from a signing service, and then stored as GitHub secrets.

## Google Play

1. Create a Play Console account. The registration fee is $25, paid once.
2. Create the app with package name `com.curlygurl.fitness`.
3. Health Connect requires a privacy-policy address. The app is set to:

   `https://bodygodz.github.io/Body-Godz-Fitness-tracker-/privacy.html`

   That page is `privacy.html` in this repository. It explains the health reads, that the app does not sell health data, and that the website cannot read Apple Health or Health Connect. Publish `privacy.html` on the live site before you submit the Play review. Publishing this whole branch would also replace the live app, so publish the privacy page on its own if the rest of this branch is not ready.
4. In Play Console, fill in the Health Connect declaration for these read-only types: Steps, Exercise, Active calories burned, Heart rate, Sleep, and Weight. Say they fill the member’s diary. The app does not use them for ads and does not sell them.
5. Phones on Android 14 already include Health Connect. Older phones need the Health Connect app from the Play Store. The app’s minimum Android version is 8.0, which is what Health Connect requires.

## Signing, kept in GitHub secrets

Do not commit a keystore, a `.p12`, a provisioning profile, or a password. The workflow in `.github/workflows/native.yml` does not read any secrets. It builds an Android debug APK, an unsigned Android App Bundle (`.aab`), and an iOS app for the simulator with signing turned off.

When you are ready for store builds, add these secret names in the GitHub repository settings. Leave the values only in GitHub.

Android:

- `ANDROID_KEYSTORE_BASE64` — the upload keystore file, encoded as base64
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`

Apple:

- `APPLE_TEAM_ID`
- `APPLE_CERTIFICATE_P12_BASE64` — the distribution certificate exported as a `.p12`, encoded as base64
- `APPLE_CERTIFICATE_PASSWORD`
- `APPLE_PROVISIONING_PROFILE_BASE64` — an App Store profile for `com.curlygurl.fitness` with HealthKit turned on
- `APP_STORE_CONNECT_API_KEY_ID`
- `APP_STORE_CONNECT_API_ISSUER_ID`
- `APP_STORE_CONNECT_API_KEY` — the contents of the App Store Connect `.p8` key

The debug APK can be installed on a phone for a test. Play Console will not accept it, and it will not accept the unsigned bundle until that bundle is signed with the upload key.

## Build it yourself

From the repository folder:

```
node native/scripts/copy-web.mjs
cd native
npm ci
npx cap sync
```

Android debug APK:

```
cd android
./gradlew assembleDebug
```

The APK is `native/android/app/build/outputs/apk/debug/app-debug.apk`.

On a Mac, open `native/ios/App/App.xcodeproj`, choose your team, and run the app. The HealthKit capability has to stay on.

## Notes you can paste for review

Apple:

Curly Gurl Fitness is a meal, workout, and diary app. On iPhone the member can tap Connect under Apps & Devices. The app then asks to read steps, workouts, active calories, heart rate, sleep, and weight from Apple Health, including readings Apple Watch has saved there. The last 14 days are copied into that member’s diary. The app does not write anything back to Apple Health. Health access is optional. The same numbers can be typed by hand. A demo login can be provided on request.

Google Play:

The app uses Health Connect to read Steps, Exercise, Active calories burned, Heart rate, Sleep, and Weight. Wear OS watches are included. A Samsung Galaxy Watch is included after Samsung Health shares those readings into Health Connect. The member taps Connect. The last 14 days are saved in the diary, and weight also uses the existing weigh-in sync. The app does not write health data and does not use it for advertising. Privacy policy: https://bodygodz.github.io/Body-Godz-Fitness-tracker-/privacy.html

## What GitHub Actions does not do

The workflow does not upload to TestFlight or Play, does not sign the release bundle, and does not change the GitHub Pages site. It runs when `native/capacitor` is pushed, and when a pull request targets `preview/login-phone`. It does not run for `main`.
