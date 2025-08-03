import DairyLoadingScreen from "@/components/Loading";
import { useAuth } from "@/context/AuthContext";
import { Redirect } from "expo-router";
import React from "react";

export default function Index() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <DairyLoadingScreen loading loadingText="Checking authentication..." />;
  }
  if (!user) {
    return <Redirect href="/login" />;
  }

  switch (user.role) {
    case "Admin":
      return <Redirect href="/(admin)" />;
    case "Farmer":
      return <Redirect href="/(tabs)" />;
    case "Buyer":
    case "User":
    default:
      return <Redirect href="/(buyer)" />; // Farmer tabs at root
  }
}