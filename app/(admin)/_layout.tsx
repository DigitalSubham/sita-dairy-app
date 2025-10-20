import { CustomDrawer } from "@/components/common/CustomDrawer";
import Icon from "@/components/common/Icon";
import DairyLoadingScreen from "@/components/Loading";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "expo-router";
import { Drawer } from "expo-router/drawer";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

export default function Layout() {

  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { t } = useTranslation()

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
      title: t("navigation.dashboard"),
      icon: Icon("home")
    },
    {
      name: "payments",
      title: t("navigation.payments"),
      icon: Icon("wallet")
    },
    {
      name: "milkEntry",
      title: t("navigation.milk_entry"),
      icon: Icon("entry")
    },
    {
      name: "rateChartScreen",
      title: t("navigation.rate_chart"),
      icon: Icon("up-arrow"),
    },
    {
      name: "record",
      title: t("navigation.all_records"),
      icon: Icon("ledger"),
    },
    {
      name: "customers",
      title: t("navigation.users"),
      icon: Icon("users"),
    },
    {
      name: "rearrange",
      title: t("navigation.rearrange_users"),
      icon: Icon("rearrange"),
    },
    {
      name: "products",
      title: t("navigation.products"),
      icon: Icon("products"),
    },
    {
      name: "profile",
      title: t("navigation.profile"),
      icon: Icon("user"),
    },
    {
      name: "settings",
      title: t("navigation.settings"),
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
