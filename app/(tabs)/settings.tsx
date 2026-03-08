import SettingsComponent from '@/components/common/Settings';
import { api } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';


export default function SettingsScreen() {
  const { signOut } = useAuth();
  const { t } = useTranslation();

  const [notifications, setNotifications] = useState(true);
  const [emailUpdates, setEmailUpdates] = useState(false);

  const handleSignOut = () => {
    signOut();
    router.replace("/(auth)/login");
  };

  const handleDeleteAccount = async () => {
    try {
      const storedToken = await AsyncStorage.getItem("token");

      if (!storedToken) {
        Toast.show({
          type: "error",
          text1: t("records.authentication_token_not_found"),
        });
        return;
      }

      const parsedToken = JSON.parse(storedToken);

      const response = await fetch(api.deleteAccount, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${parsedToken}`,
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Optional: clear AsyncStorage if needed
        await AsyncStorage.clear();

        // Call your auth sign out logic
        signOut();

        // Redirect to login screen
        router.replace("/(auth)/login");
      } else {
        console.error("Failed to delete account:", data);
        Toast.show({
          type: "error",
          text1: t("settings.account_deletion_failed"),
          text2: data.message || t("common.something_wrong_retry"),
        });
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      Toast.show({
        type: "error",
        text1: t("settings.unexpected_error_occurred"),
      });
    }
  };

  return (
    <SettingsComponent
      handleDeleteAccount={handleDeleteAccount}
      handleSignOut={handleSignOut}
      notifications={notifications}
      setNotifications={setNotifications}
      emailUpdates={emailUpdates}
      setEmailUpdates={setEmailUpdates}
    />
  );
}
