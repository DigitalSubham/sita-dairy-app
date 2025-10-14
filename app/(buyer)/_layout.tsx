import { CustomDrawer } from "@/components/common/CustomDrawer";
import Icon from "@/components/common/Icon";
import { Drawer } from "expo-router/drawer";

export default function Layout() {
    const screens = [
        {
            name: "index",
            title: "Products",
            icon: Icon("user"),
        },
        {
            name: "payment",
            title: "Payments",
            icon: Icon("user"),
        },
        {
            name: "records",
            title: "Milk Subcription",
            icon: Icon("user"),
        },
        {
            name: "profile",
            title: "Profile",
            icon: Icon("user"),
        },
        {
            name: "Settings",
            title: "Settings",
            icon: Icon("user"),
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


