import DairyLoadingScreen from "@/components/Loading";
import { useAuth } from "@/context/AuthContext";
import { Redirect } from "expo-router";
import React from "react";

export default function HomeScreen() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <DairyLoadingScreen
        loading={isLoading}
        loadingText="Syncing your farm data..."
      />
    );
  }

  if (!isAuthenticated || !user) {
    return <Redirect href="/(auth)/login" />;
  }

  // default to login just in case
  let redirectHref: "/(auth)/login" | "/(admin)" | "/(tabs)" | "/(buyer)" =
    "/(auth)/login";

  switch (user.role) {
    case "Admin":
      redirectHref = "/(admin)";
      break;

    case "Buyer":
      redirectHref = "/(buyer)";
      break;

    case "Farmer":
      redirectHref = "/(tabs)";
      break;
  }

  return <Redirect href={redirectHref} />;
}


// 9990872418