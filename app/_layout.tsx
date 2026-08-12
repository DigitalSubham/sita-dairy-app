import { AuthProvider, useAuth } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import i18n from "@/i18n";
import { registerAndSavePushToken } from "@/utils/pushNotifications";
import { Stack, useRouter } from "expo-router";
import * as Notifications from "expo-notifications";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { I18nextProvider } from "react-i18next";
import { LogBox } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";


LogBox.ignoreAllLogs()

SplashScreen.preventAutoHideAsync();

// Module scope, not inside a component — must be set once, early, so
// notifications still show a banner while the app is in the foreground.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Registers this device for push once a Farmer/Buyer/User is logged in.
// Runs on every mount where `user` changes, not just right after sign-in —
// that also covers the common case of the app cold-starting into an
// already-authenticated session.
const PushNotificationRegistrar = () => {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && user.role !== "Admin") {
      registerAndSavePushToken();
    }
  }, [user?._id, user?.role]);

  // Tap-to-open: routes to that role's Records screen. Handles both a tap
  // while the app is already running (foreground/background) and the app
  // being cold-started by tapping a notification from a killed state.
  useEffect(() => {
    const goToRecords = (data: Record<string, unknown> | undefined) => {
      if (data?.type !== "milk-entry") return;
      if (user?.role === "Farmer") {
        router.push("/(tabs)/records");
      } else if (user?.role === "Buyer" || user?.role === "User") {
        router.push("/(buyer)/records");
      }
    };

    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        goToRecords(response.notification.request.content.data);
      }
    });

    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => goToRecords(response.notification.request.content.data)
    );

    return () => subscription.remove();
  }, [user?.role, router]);

  return null;
};

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  useEffect(() => {
    if (appIsReady) {
      SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) return null;

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <I18nextProvider i18n={i18n}>
          <AuthProvider>
            <PushNotificationRegistrar />
            <CartProvider>
              <StatusBar style="dark" />
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(auth)" options={{ animation: "none" }} />
                <Stack.Screen name="(tabs)" options={{ animation: "fade" }} />
                <Stack.Screen name="(admin)" options={{ animation: "fade" }} />
                <Stack.Screen name="(buyer)" options={{ animation: "fade" }} />
                <Stack.Screen name="+not-found" options={{ presentation: "modal" }} />
              </Stack>
              <Toast />
            </CartProvider>
          </AuthProvider>
        </I18nextProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
