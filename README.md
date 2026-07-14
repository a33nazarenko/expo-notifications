# expo-notifications

A reference implementation of push notifications in an Expo app using [`expo-notifications`](https://docs.expo.dev/versions/v57.0.0/sdk/notifications/) (SDK 57).

The app registers for push permissions, retrieves Expo and device push tokens, handles incoming notifications while the app is open, and displays the latest notification payload on screen.

## What this project demonstrates

- Requesting notification permissions on iOS and Android
- Creating a default Android notification channel
- Fetching an **Expo push token** via `getExpoPushTokenAsync` (used with [Expo Push Service](https://docs.expo.dev/push-notifications/sending-notifications/))
- Fetching a **native device push token** via `getDevicePushTokenAsync` (FCM on Android, APNs on iOS)
- Configuring foreground notification behavior with `setNotificationHandler`
- Listening for notifications received in the foreground and user tap responses
- Sharing notification state across the app with React Context

## Tech stack

- [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/)
- [Expo Router](https://docs.expo.dev/router/introduction/) (file-based routing)
- [expo-dev-client](https://docs.expo.dev/develop/development-builds/introduction/) for development builds
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
```

## Prerequisites

Push notifications require a **development build** or **production build**. They do not work in Expo Go.

Supported environments:

- Physical iOS and Android devices
- Android emulator with Google Play services
- iOS Simulator (Xcode 14+, macOS 13+, iOS 16+)

For Android push delivery, add a `google-services.json` file from Firebase to the project root (referenced in `app.json`). This file is gitignored and must be added locally.

## Get started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the development server:

   ```bash
   npx expo start
   ```

3. Run on a device using a development build:

   ```bash
   npm run build:ios:dev   # build iOS dev client via EAS
   ```

   Or open the app in an existing dev client / simulator from the Expo CLI menu.

## How it works

1. **`_layout.tsx`** sets the foreground notification handler (sound, badge, banner) and wraps the app in `NotificationProvider`.
2. **`registerForPushNotificationAsync.ts`** requests permissions, sets up the Android channel, and retrieves the Expo push token using the EAS project ID from `app.json`.
3. **`NotificationContext.tsx`** registers for push on mount, stores tokens and the latest notification, and subscribes to:
   - `addNotificationReceivedListener` — notification arrives while app is open
   - `addNotificationResponseReceivedListener` — user taps a notification
4. **`index.tsx`** reads from context and displays the Expo push token plus the title, body, and data of the most recent notification.

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

## EAS build profiles

Build profiles are defined in `eas.json`:

| Profile       | Use case                          |
|---------------|-----------------------------------|
| `development` | Dev client with hot reload        |
| `preview`     | Internal distribution             |
| `production`  | App Store / Play Store release    |

```bash
eas build --profile development --platform ios
eas build --profile development --platform android
```

## Learn more

- [Expo Notifications SDK reference](https://docs.expo.dev/versions/v57.0.0/sdk/notifications/)
- [Push notifications setup guide](https://docs.expo.dev/push-notifications/push-notifications-setup/)
- [Send notifications with Expo Push Service](https://docs.expo.dev/push-notifications/sending-notifications/)
