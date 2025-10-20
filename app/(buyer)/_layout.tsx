import { CustomDrawer } from "@/components/common/CustomDrawer";
import Icon from "@/components/common/Icon";
import { Drawer } from "expo-router/drawer";
import { useTranslation } from "react-i18next";

export default function Layout() {
    const { t } = useTranslation()
    const screens = [
        {
            name: "index",
            title: t("navigation.products"),
            icon: Icon("home"),
        },
        {
            name: "payment",
            title: t("navigation.payments"),
            icon: Icon("wallet"),
        },
        {
            name: "records",
            title: t("navigation.milk_subscription"),
            icon: Icon("ledger"),
        },
        {
            name: "profile",
            title: t("navigation.profile"),
            icon: Icon("user"),
        },
        {
            name: "Settings",
            title: t("navigation.settings"),
            icon: Icon("settings"),
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


