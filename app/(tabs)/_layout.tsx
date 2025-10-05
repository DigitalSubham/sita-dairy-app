import { CustomDrawer } from "@/components/common/CustomDrawer";
import DairyLoadingScreen from "@/components/Loading";
import { useAuth } from "@/context/AuthContext";
import { Feather, FontAwesome, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Drawer } from "expo-router/drawer";
import { useEffect } from "react";

export default function Layout() {

  const { user, isLoading } = useAuth();
  const router = useRouter();


  useEffect(() => {
    if (isLoading) return;
    if (user?.role === "Buyer" || user?.role === "User") {
      router.replace("/(buyer)");
    } else if (user?.role === "Admin") {
      router.replace("/(admin)");
    }
    else if (user?.role !== "Farmer") {
      router.replace("/+not-found");
    }
  }, [user, isLoading]);

  if (isLoading) {
    return <DairyLoadingScreen loading loadingText={`Verifying ${user?.role} access...`} />;
  }

  const screens = [
    {
      name: "index",
      title: "Dashboard",
      icon: (size: number, color: string) => (
        <Ionicons name="home-outline" size={size} color={color} />
      ),
    },
    {
      name: "payment",
      title: "Payments",
      icon: (size: number, color: string) => <FontAwesome name="rupee" size={size} color={color} />,
    },
    {
      name: "products",
      title: "Products",
      icon: (size: number, color: string) => <FontAwesome name="product-hunt" size={size} color={color} />,
    },
    {
      name: "records",
      title: "Milk Records",
      icon: (size: number, color: string) => (
        <Feather name="bar-chart-2" size={20} color={color} />
      ),
    },
    {
      name: "viewRates",
      title: "Milk Rates",
      icon: (size: number, color: string) => (
        <MaterialIcons name="show-chart" size={20} color={color} />
      ),
    },
    {
      name: "profile",
      title: "Profile",
      icon: (size: number, color: string) => (
        <Ionicons name="person-circle-outline" size={size} color={color} />
      ),
    },
    {
      name: "settings",
      title: "Settings",
      icon: (size: number, color: string) => (
        <Ionicons name="settings-outline" size={size} color={color} />
      ),
    },
  ];

  return (


    <Drawer
      drawerContent={(props) => <CustomDrawer {...props} />}
      screenOptions={{
        headerShown: false,
        drawerActiveBackgroundColor: "#e0e7ff", // Light blue highlight
        drawerActiveTintColor: "#1e3a8a", // Dark blue text
        drawerInactiveTintColor: "#374151", // Dark gray
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
              ? ({ size, color }: { size: number; color: string }) =>
                icon(size, color)
              : undefined,
          }}
        />
      ))}
    </Drawer>

  );
}

