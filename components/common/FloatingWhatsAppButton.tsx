import { FontAwesome } from "@expo/vector-icons";
import type React from "react";
import { useTranslation } from "react-i18next";
import { Alert, Linking, Platform, StyleSheet, TouchableOpacity } from "react-native";

const SUPPORT_PHONE_NUMBER = "918892293899";

export const FloatingWhatsAppButton: React.FC = () => {
    const { t } = useTranslation();

    const openWhatsApp = () => {
        const message = t("common.whatsapp_help_message");

        const url =
            Platform.OS === "android"
                ? `whatsapp://send?phone=${SUPPORT_PHONE_NUMBER}&text=${encodeURIComponent(message)}`
                : `https://api.whatsapp.com/send?phone=${SUPPORT_PHONE_NUMBER}&text=${encodeURIComponent(message)}`;

        Linking.canOpenURL(url)
            .then((supported) => {
                if (supported) {
                    return Linking.openURL(url);
                }
                Alert.alert(
                    t("products.whatsapp_not_installed"),
                    t("products.install_whatsapp_to_contact")
                );
            })
            .catch((err) => console.error("Error opening WhatsApp:", err));
    };

    return (
        <TouchableOpacity
            style={styles.button}
            activeOpacity={0.85}
            onPress={openWhatsApp}
        >
            <FontAwesome name="whatsapp" size={30} color="#FFFFFF" />
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        position: "absolute",
        bottom: 24,
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: "#25D366",
        alignItems: "center",
        justifyContent: "center",
        elevation: 6,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        zIndex: 1000,
    },
});
