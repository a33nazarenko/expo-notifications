# expo-notifications

A reference implementation of push notifications in an Expo app using [`expo-notifications`](https://docs.expo.dev/versions/v57.0.0/sdk/notifications/) (SDK 57).

The app registers for push permissions, retrieves Expo and device push tokens, handles incoming notifications while the app is open, and displays the latest notification payload on screen. On iOS, a **Notification Service Extension** (via [`@bacons/apple-targets`](https://github.com/EvanBacon/expo-apple-targets)) downloads and attaches images for rich push notifications before they are displayed.

## What this project demonstrates

- Requesting notification permissions on iOS and Android
- Creating a default Android notification channel
- Fetching an **Expo push token** via `getExpoPushTokenAsync` (used with [Expo Push Service](https://docs.expo.dev/push-notifications/sending-notifications/))
- Fetching a **native device push token** via `getDevicePushTokenAsync` (FCM on Android, APNs on iOS)
- Configuring foreground notification behavior with `setNotificationHandler`
- Listening for notifications received in the foreground and user tap responses
- Sharing notification state across the app with React Context
- **Rich content on iOS** — a Notification Service Extension downloads notification images before display (Android shows images out of the box via FCM)

## Tech stack

- [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/)
- [Expo Router](https://docs.expo.dev/router/introduction/) (file-based routing)
- [expo-dev-client](https://docs.expo.dev/develop/development-builds/introduction/) for development builds
- [@bacons/apple-targets](https://github.com/EvanBacon/expo-apple-targets) for the iOS Notification Service Extension
- [EAS Build](https://docs.expo.dev/build/introduction/) for native builds

## Project structure

```
src/
├── app/
│   ├── _layout.tsx          # Notification handler + NotificationProvider
│   └── index.tsx            # Displays push token and latest notification
├── context/
│   └── NotificationContext.tsx  # Token registration and notification listeners
└── utils/
    └── registerForPushNotificationAsync.ts  # Permission + token logic

targets/
└── notification-service/      # iOS Notification Service Extension (rich content)
    ├── expo-target.config.js  # Target type and entitlements
    ├── NotificationService.swift  # Downloads and attaches notification images
    ├── Info.plist
    └── generated.entitlements
```

## Prerequisites

Push notifications require a **development build** or **production build**. They do not work in Expo Go.

**Accounts and tools:**

- An [Expo account](https://expo.dev/signup) and [EAS CLI](https://docs.expo.dev/build/setup/) (`npm install -g eas-cli && eas login`)
- A [Firebase project](https://console.firebase.google.com/) for Android FCM
- A **paid [Apple Developer account](https://developer.apple.com/programs/)** for iOS push notifications and device builds

**Supported test environments:**

- Physical iOS and Android devices
- Android emulator with Google Play services
- iOS Simulator (Xcode 14+, macOS 13+, iOS 16+)

## Configure push credentials

Push notifications need platform credentials before they can be delivered. This project uses EAS to manage most of that setup.

### Android — get `google-services.json` from Firebase

The Android app needs `google-services.json` so it can register with Firebase Cloud Messaging (FCM). This project already points to it in `app.json`:

```json
"android": {
  "package": "com.a33n.exponotifications",
  "googleServicesFile": "./google-services.json"
}
```

Steps:

1. Open the [Firebase Console](https://console.firebase.google.com/) and create a project (or select an existing one).
2. Click **Add app** → **Android**.
3. Enter the Android package name **`com.a33n.exponotifications`** — it must match `app.json` exactly.
4. Finish the wizard and download **`google-services.json`**.
5. Place the file in the project root (same folder as `app.json`).

This file is gitignored in this repo. Add it locally on each machine that builds Android.

> `google-services.json` contains public Firebase identifiers. Some teams commit it; this project keeps it local via `.gitignore`.

### Android — get the Firebase service account key (FCM V1)

Expo Push Service uses FCM V1 on Android. You need a **service account private key** uploaded to EAS — separate from `google-services.json`.

Steps:

1. In Firebase Console, open **Project settings** → **Service accounts**.
2. Click **Generate new private key** → **Generate key**.
3. Save the downloaded JSON file locally (for example `expo-notifications-service-account.json`).
4. **Do not commit this file** — it contains a private key. Add it to `.gitignore`.
5. Upload the key to EAS using one of these options:

**Option A — EAS CLI**

```bash
eas credentials
```

Then follow the prompts:

- **Android** → **production** (or your build profile) → **Google Service Account**
- **Manage your Google Service Account Key for Push Notifications (FCM V1)**
- **Set up a Google Service Account Key for Push Notifications (FCM V1)** → **Upload a new service account key**

If the JSON file is in your project directory, EAS CLI detects it and asks you to confirm.

**Option B — Expo dashboard**

1. Open your project on [expo.dev](https://expo.dev).
2. Go to **Project settings** → **Credentials** → **Android**.
3. Select your application identifier (`com.a33n.exponotifications`).
4. Under **Service Credentials** → **FCM V1 service account key**, upload the JSON file.

See the [FCM credentials guide](https://docs.expo.dev/push-notifications/fcm-credentials/) for details.

### iOS — automatic setup with EAS Build

iOS push notifications require a paid Apple Developer account. EAS can create and store the required Apple credentials for you during your first development build — no manual APNs key setup in the Apple Developer portal.

Before building:

1. Register the physical iPhone you want to test on:

   ```bash
   eas device:create
   ```

   Scan the QR code on your device to add its UDID to your Apple Developer account.

2. Run the development build:

   ```bash
   eas build --profile development --platform ios
   ```

   On the first build, EAS CLI walks you through setup interactively. Answer **Yes** when asked about:
   - Logging in to your **Apple Developer account**
   - **Setting up push notifications** for the project
   - **Generating a new Apple Push Notifications service key** (APNs)

   EAS also handles related iOS signing assets for a development build, such as:
   - Distribution certificate
   - Ad hoc provisioning profile (includes your registered test devices)
   - Push notification entitlement on the app identifier

3. When the build finishes, install it on your registered device from the link EAS provides (or via the Expo dashboard).

You only need to go through the full credential flow once. Later builds reuse the credentials stored on EAS.

If you skipped push setup initially, run `eas credentials`, select **iOS**, and configure push notifications manually.

See [Expo push notifications setup](https://docs.expo.dev/push-notifications/push-notifications-setup/#get-credentials-for-development-builds) for the official walkthrough.

## Get started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the development server:

   ```bash
   npx expo start
   ```

3. Complete [Configure push credentials](#configure-push-credentials) above, then create a development build:

   ```bash
   eas build --profile development --platform ios
   eas build --profile development --platform android
   ```

   Or use the npm shortcut for iOS:

   ```bash
   npm run build:ios:dev
   ```

4. After installing the dev build, start the dev server and open the app on your device:

   ```bash
   npx expo start --dev-client
   ```

## How it works

1. **`_layout.tsx`** sets the foreground notification handler (sound, badge, banner) and wraps the app in `NotificationProvider`.
2. **`registerForPushNotificationAsync.ts`** requests permissions, sets up the Android channel, and retrieves the Expo push token using the EAS project ID from `app.json`.
3. **`NotificationContext.tsx`** registers for push on mount, stores tokens and the latest notification, and subscribes to:
   - `addNotificationReceivedListener` — notification arrives while app is open
   - `addNotificationResponseReceivedListener` — user taps a notification
4. **`index.tsx`** reads from context and displays the Expo push token plus the title, body, and data of the most recent notification.

## Rich content notifications (iOS)

Android displays notification images automatically via FCM. iOS requires a **Notification Service Extension** to download and attach images before the notification is shown.

This project uses [`@bacons/apple-targets`](https://github.com/EvanBacon/expo-apple-targets) to add that extension without ejecting from the managed workflow.

### Setup

1. The `@bacons/apple-targets` plugin is registered in `app.json`:

   ```json
   "plugins": [
     "expo-router",
     "@bacons/apple-targets"
   ]
   ```

2. The extension lives in `targets/notification-service/`. It was scaffolded with:

   ```bash
   npx create-target notification-service
   ```

3. `NotificationService.swift` implements the image download logic. When a push payload includes rich content, the extension fetches the image URL and attaches it to the notification before delivery.

### Rebuild after target changes

After adding or changing targets, `expo-target.config.js`, or the plugin in `app.json`, create a new iOS build:

```bash
eas build --profile development --platform ios
```

Swift-only changes in `targets/notification-service/` are picked up on the next build without a `prebuild --clean`. Configuration changes require a fresh prebuild (handled automatically by EAS Build).

### Send a rich notification

Use the Expo Push API [`richContent`](https://docs.expo.dev/push-notifications/sending-notifications/) field with `mutableContent: true` on iOS:

```bash
curl -H "Content-Type: application/json" \
  -X POST https://exp.host/--/api/v2/push/send \
  -d '{
    "to": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
    "title": "Hello",
    "body": "Check out this image",
    "mutableContent": true,
    "richContent": {
      "image": "https://picsum.photos/400/300"
    }
  }'
```

Replace the `to` value with your Expo push token. The image must be a publicly accessible HTTPS URL.

See the [Expo notification service extension example](https://github.com/expo/expo/pull/36202) for the reference implementation this project follows.

## Test push notifications

1. Launch the app on a device and copy the **Expo push token** shown on the home screen.
2. Send a test notification with the [Expo Push Notifications Tool](https://expo.dev/notifications) or your backend using the [Expo Push API](https://docs.expo.dev/push-notifications/sending-notifications/).

Example curl request:

```bash
curl -H "Content-Type: application/json" \
  -X POST https://exp.host/--/api/v2/push/send \
  -d '{
    "to": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
    "title": "Hello",
    "body": "This is a test notification",
    "data": { "foo": "bar" }
  }'
```

Replace the `to` value with your Expo push token.

For image attachments on iOS, see [Rich content notifications (iOS)](#rich-content-notifications-ios) above.

## EAS build profiles

Build profiles are defined in `eas.json`:

| Profile       | Use case                       |
| ------------- | ------------------------------ |
| `development` | Dev client with hot reload     |
| `preview`     | Internal distribution          |
| `production`  | App Store / Play Store release |

```bash
eas build --profile development --platform ios
eas build --profile development --platform android
```

## Learn more

- [Expo Notifications SDK reference](https://docs.expo.dev/versions/v57.0.0/sdk/notifications/)
- [Push notifications setup guide](https://docs.expo.dev/push-notifications/push-notifications-setup/)
- [Send notifications with Expo Push Service](https://docs.expo.dev/push-notifications/sending-notifications/)
- [@bacons/apple-targets](https://github.com/EvanBacon/expo-apple-targets) — config plugin for iOS app extensions
