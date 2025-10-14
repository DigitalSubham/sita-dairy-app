import { CustomDrawer } from "@/components/common/CustomDrawer";
import Icon from "@/components/common/Icon";
import DairyLoadingScreen from "@/components/Loading";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "expo-router";
import { Drawer } from "expo-router/drawer";
import { useEffect } from "react";

export default function Layout() {

  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (user?.role !== "Admin") {
      router.replace("/+not-found");
    }
  }, [user, isLoading]);

  if (isLoading || user?.role !== "Admin") {
    return <DairyLoadingScreen loading loadingText="Verifying Farmer access..." />;
  }


  const screens = [
    {
      name: "index",
      title: "Dashboard",
      icon: Icon("home")
    },
    {
      name: "payments",
      title: "Payments",
      icon: Icon("wallet")
    },
    {
      name: "milkEntry",
      title: "Milk Entry",
      icon: Icon("entry")
    },
    {
      name: "rateChartScreen",
      title: "Rate Chart",
      icon: Icon("up-arrow"),
    },
    {
      name: "record",
      title: "All Records",
      icon: Icon("ledger"),
    },
    {
      name: "customers",
      title: "Users",
      icon: Icon("users"),
    },
    {
      name: "rearrange",
      title: "Rearrange Users",
      icon: Icon("rearrange"),
    },
    {
      name: "products",
      title: "Products",
      icon: Icon("products"),
    },
    {
      name: "profile",
      title: "Profile",
      icon: Icon("user"),
    },
    {
      name: "settings",
      title: "Settings",
      icon: Icon("settings"),
    },
  ]

  return (
    <Drawer
      drawerContent={(props) => <CustomDrawer {...props} />}
      screenOptions={{
        // Hide the default header since we're using custom headers
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
            drawerIcon: icon ? ({ size, color }: { size: number; color: string }) => icon(size, color) : undefined,
          }}
        />
      ))}
    </Drawer>
  )
}
