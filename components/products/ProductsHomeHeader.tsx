import { Entypo, Feather } from "@expo/vector-icons";
import { DrawerActions, useNavigation } from "@react-navigation/native";
import type React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { CartIconButton } from "./CartIconButton";

type ProductsHomeHeaderProps = {
    name?: string;
    walletBalance: number | null;
    onWalletPress: () => void;
    cartCount: number;
    onCartPress: () => void;
};

const greetingKey = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return "common.good_morning";
    if (hour < 17) return "common.good_afternoon";
    return "common.good_evening";
};

export const ProductsHomeHeader: React.FC<ProductsHomeHeaderProps> = ({
    name,
    walletBalance,
    onWalletPress,
    cartCount,
    onCartPress,
}) => {
    const { t } = useTranslation();
    const navigation = useNavigation();

    return (
        <View style={styles.container}>
            <View style={styles.identity}>
                <TouchableOpacity
                    style={styles.avatar}
                    activeOpacity={0.7}
                    onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
                >
                    <Feather name="menu" size={20} color="#6366F1" />
                </TouchableOpacity>
                <View>
                    <Text style={styles.greeting}>{t(greetingKey())}</Text>
                    <Text style={styles.name} numberOfLines={1}>
                        {t("common.hi_name", { name: name || "" })}
                    </Text>
                </View>
            </View>

            <View style={styles.rightSection}>
                <CartIconButton count={cartCount} onPress={onCartPress} />
                <TouchableOpacity style={styles.walletChip} activeOpacity={0.85} onPress={onWalletPress}>
                    <Entypo name="wallet" size={14} color="#FFFFFF" />
                    <Text style={styles.walletChipText}>
                        ₹{walletBalance !== null ? walletBalance.toFixed(0) : "--"}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 16,
        backgroundColor: "#FFFFFF",
        borderBottomWidth: 1,
        borderBottomColor: "#E5E7EB",
    },
    identity: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
        marginRight: 12,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#EEF2FF",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 10,
        overflow: "hidden",
    },
    greeting: {
        fontSize: 12,
        color: "#6B7280",
    },
    name: {
        fontSize: 16,
        fontWeight: "700",
        color: "#111827",
    },
    rightSection: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    walletChip: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: "#6366F1",
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
    },
    walletChipText: {
        color: "#FFFFFF",
        fontWeight: "700",
        fontSize: 14,
    },
});
