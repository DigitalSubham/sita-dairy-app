import SettingsComponent from '@/components/common/Settings';
import { api } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from 'expo-router';
import { useState } from 'react';
import Toast from 'react-native-toast-message';


export default function SettingsScreen() {
  const { signOut } = useAuth();

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
          text1: "Authentication token not found",
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
          text1: "Account deletion failed",
          text2: data.message || "Something went wrong",
        });
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      Toast.show({
        type: "error",
        text1: "An unexpected error occurred",
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
