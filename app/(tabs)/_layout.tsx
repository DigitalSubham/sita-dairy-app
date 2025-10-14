import { useRouter } from "expo-router";
import { Drawer } from "expo-router/drawer";
import { useEffect } from "react";

import { CustomDrawer } from "@/components/common/CustomDrawer";
import Icon from "@/components/common/Icon";
import DairyLoadingScreen from "@/components/Loading";
import { useAuth } from "@/context/AuthContext";

export default function Layout() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // 🔁 Redirect users based on role
  useEffect(() => {
    if (isLoading) return;

    switch (user?.role) {
      case "Buyer":
      case "User":
        router.replace("/(buyer)");
        break;
      case "Admin":
        router.replace("/(admin)");
        break;
      case "Farmer":
        break; // Farmer stays here
      default:
        router.replace("/+not-found");
        break;
    }
  }, [user, isLoading]);

  // 🕒 Show loading screen while verifying
  if (isLoading) {
    return (
      <DairyLoadingScreen
        loading
        loadingText={`Verifying ${user?.role ?? "user"} access...`}
      />
    );
  }

  // 🧱 Drawer screens configuration
  const screens = [
    { name: "index", title: "Dashboard", icon: Icon("home") },
    { name: "payment", title: "Payments", icon: Icon("wallet") },
    { name: "products", title: "Products", icon: Icon("products") },
    { name: "records", title: "Milk Records", icon: Icon("ledger") },
    { name: "viewRates", title: "Milk Rates", icon: Icon("up-arrow") },
    { name: "profile", title: "Profile", icon: Icon("user") },
    { name: "settings", title: "Settings", icon: Icon("settings") },
  ];

  return (
    <Drawer
      drawerContent={(props) => <CustomDrawer {...props} />}
      screenOptions={{
        headerShown: false,
        drawerActiveBackgroundColor: "#e0e7ff",
        drawerActiveTintColor: "#1e3a8a",
        drawerInactiveTintColor: "#374151",
        drawerLabelStyle: {
          marginLeft: 0,
          fontSize: 15,
        },
      }}
    >
      {screens.map(({ name, title, icon }) => (
        <Drawer.Screen
          key={name}
          name={name}
          options={{
            title,
            drawerIcon: icon
              ? ({ size, color }) => icon(size, color)
              : undefined,
          }}
        />
      ))}
    </Drawer>
  );
}
