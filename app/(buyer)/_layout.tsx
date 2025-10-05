import { CustomDrawer } from "@/components/common/CustomDrawer";
import { Feather, FontAwesome, Ionicons } from "@expo/vector-icons";
import { Drawer } from "expo-router/drawer";

export default function Layout() {
    const screens = [
        {
            name: "index",
            title: "Products",
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
            name: "records",
            title: "Milk Subcription",
            icon: (size: number, color: string) => (
                <Feather name="bar-chart-2" size={20} color={color} />
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
            name: "Settings",
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


