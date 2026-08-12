import { api } from "@/constants/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// Resolves an Expo push token for this device, or null if it can't (no
// physical device / permission denied / no EAS project id configured).
// Never throws — every failure mode is a reason to skip registration, not
// a reason to break whatever screen triggered this.
export const registerForPushNotificationsAsync = async (): Promise<string | null> => {
    try {
        // Expo Go (SDK 53+) has no remote push support at all — calling any
        // Notifications API here throws/console.errors from inside the
        // library itself, so bail out before touching it.
        if (Constants.appOwnership === "expo") {
            return null;
        }

        if (!Device.isDevice) {
            // Simulators/emulators can't receive remote push.
            return null;
        }

        if (Platform.OS === "android") {
            await Notifications.setNotificationChannelAsync("default", {
                name: "default",
                importance: Notifications.AndroidImportance.DEFAULT,
            });
        }

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== "granted") {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        if (finalStatus !== "granted") {
            return null;
        }

        const projectId = Constants?.expoConfig?.extra?.eas?.projectId;
        if (!projectId) {
            console.error("Missing EAS projectId — cannot get an Expo push token.");
            return null;
        }

        const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
        return token;
    } catch (error) {
        console.error("Error registering for push notifications:", error);
        return null;
    }
};

// POSTs a token to the backend against the currently logged-in user.
// Fire-and-forget from the caller's perspective — swallows its own errors.
export const savePushTokenToServer = async (token: string): Promise<void> => {
    try {
        const storedToken = await AsyncStorage.getItem("token");
        const authToken = storedToken ? JSON.parse(storedToken) : null;
        if (!authToken) return;

        await fetch(api.pushToken, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({ token }),
        });
    } catch (error) {
        console.error("Error saving push token to server:", error);
    }
};

// Convenience wrapper: get a token and save it, in one call.
export const registerAndSavePushToken = async (): Promise<void> => {
    const token = await registerForPushNotificationsAsync();
    if (token) {
        await savePushTokenToServer(token);
    }
};
