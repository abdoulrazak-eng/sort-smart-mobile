# Publishing SmartEco to the App Store & Google Play

SmartEco is a web app. To ship it to the stores it is wrapped with
[Capacitor](https://capacitorjs.com), which produces real Xcode and Android Studio
projects around the deployed site. Capacitor is already configured here
(`capacitor.config.ts`); the steps below are run on your own Mac / PC, not in Lovable.

## 0. Prerequisites

| Need | Details |
| --- | --- |
| Apple Developer Program | $99/year — required for App Store & TestFlight |
| Google Play Console | $25 one-time |
| iOS build machine | macOS + Xcode 15+ and CocoaPods (`sudo gem install cocoapods`) |
| Android build machine | Android Studio (any OS) + JDK 17 |
| Node | Node 20+ |

## 1. Publish the web app first

Click **Publish** in Lovable. The native shell loads the live site, so the URL in
`capacitor.config.ts` (`server.url`) must be live and HTTPS. If you connect a custom
domain, update that URL and rebuild the native apps.

## 2. Get the code and add platforms

```bash
git clone <your repo>   # or export the project from Lovable → GitHub
cd <project>
npm install
npx cap add ios
npx cap add android
npx cap sync
```

This creates `ios/` and `android/` folders (native projects, committed to your repo).

## 3. Camera permission strings

SmartEco needs the camera. Add these once after `cap add`:

**iOS** — `ios/App/App/Info.plist`

```xml
<key>NSCameraUsageDescription</key>
<string>SmartEco uses the camera to identify waste items and tell you which bin to use.</string>
<key>NSMicrophoneUsageDescription</key>
<string>Not used. Required by the system camera component.</string>
```

**Android** — `android/app/src/main/AndroidManifest.xml`, inside `<manifest>`

```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-feature android:name="android.hardware.camera" android:required="false" />
```

Android WebView also needs the camera prompt auto-granted for your own origin; Capacitor 6+
handles this via the `onPermissionRequest` bridge, no extra code required.

## 4. Icons and splash screens

Use the generator (reads `public/icons/icon-512.png`):

```bash
npm i -D @capacitor/assets
npx capacitor-assets generate --iconBackgroundColor '#0b1120' --splashBackgroundColor '#0b1120'
```

## 5. Run and test

```bash
npx cap open ios       # Xcode → select a device → Run
npx cap open android   # Android Studio → Run
```

Test on a **physical** device: camera APIs and the scan flow are the things reviewers check.

## 6. Ship iOS

1. Xcode → target **App** → Signing & Capabilities → select your Team, set a unique
   bundle id (default `app.lovable.smarteco`).
2. Set version + build number.
3. Product → Destination **Any iOS Device** → Product → **Archive** → Distribute App →
   App Store Connect.
4. In App Store Connect: create the app record, upload 6.7" and 5.5" screenshots,
   description, keywords, privacy policy URL, and fill **App Privacy** (camera used for
   on-request classification; sorting history is stored on-device only).
5. Submit for review. First review is typically 1–3 days.

> Apple rejects apps that are "just a website" (guideline 4.2). SmartEco qualifies because
> it uses device camera hardware and offline on-device history — say this in the review
> notes and include a test walkthrough.

## 7. Ship Android

1. Create an upload keystore (keep it safe, you cannot rotate it easily):

   ```bash
   keytool -genkey -v -keystore smarteco.keystore -alias smarteco \
     -keyalg RSA -keysize 2048 -validity 10000
   ```

2. Add signing config in `android/app/build.gradle` (or via Android Studio →
   Build → Generate Signed Bundle).
3. Build → **Generate Signed Bundle / APK** → Android App Bundle (`.aab`).
4. Play Console → create app → upload the AAB to Internal testing first, complete the
   Data safety form, content rating, target audience, and privacy policy.
5. Promote to Production. Reviews take a few hours to a few days.

## 8. Updating later

Web/UI changes go live the moment you press **Publish** in Lovable — no store review
needed, because the shell loads the live site. You only resubmit to the stores when you
change native config (icons, permissions, plugins, app version).
