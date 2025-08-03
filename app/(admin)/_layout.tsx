import { CustomDrawer } from "@/components/common/CustomDrawer";
import DairyLoadingScreen from "@/components/Loading";
import { useAuth } from "@/context/AuthContext";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Drawer } from "expo-router/drawer";
import { StatusBar } from "expo-status-bar";
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
      icon: (size: number, color: string) => <Ionicons name="home-outline" size={size} color={color} />,
    },
    {
      name: "milkEntry",
      title: "Milk Entry",
      icon: (size: number, color: string) => <Ionicons name="create-outline" size={size} color={color} />,
    },
    {
      name: "rateChartScreen",
      title: "Rate Chart",
      icon: (size: number, color: string) => <FontAwesome name="bar-chart-o" size={size} color={color} />,
    },
    {
      name: "record",
      title: "All Records",
      icon: (size: number, color: string) => <FontAwesome name="table" size={size} color={color} />,
    },
    {
      name: "customers",
      title: "Users",
      icon: (size: number, color: string) => <Ionicons name="people-outline" size={size} color={color} />,
    },
    {
      name: "rearrange",
      title: "Rearrange Users",
      icon: (size: number, color: string) => <Ionicons name="reorder-three-sharp" size={size} color={color} />,
    },
    {
      name: "products",
      title: "Products",
      icon: (size: number, color: string) => <FontAwesome name="product-hunt" size={size} color={color} />,
    },
    {
      name: "profile",
      title: "Profile",
      icon: (size: number, color: string) => <Ionicons name="person-circle-outline" size={size} color={color} />,
    },
    {
      name: "settings",
      title: "Settings",
      icon: (size: number, color: string) => <Ionicons name="settings-outline" size={size} color={color} />,
    },
  ]

  return (
    <>
      <StatusBar style="dark" />

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
    </>
  )
}
