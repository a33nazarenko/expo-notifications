import { NotificationProvider } from "@/context/NotificationContext";
import * as Notifications from "expo-notifications";
import { Stack } from "expo-router";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,

  }),
});

export default function RootLayout() {

  return (
    <NotificationProvider>
      <Stack />
    </NotificationProvider>
  );
}
