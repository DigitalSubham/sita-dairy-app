import { LANGUAGE_KEY } from "@/constants/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import React, { ReactNode, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import Icon from "../common/Icon";
import LanguageChange from "../common/LanguageChange";

type AuthTemplateProps = {
    children: ReactNode;
};

const AuthTemplate: React.FC<AuthTemplateProps> = ({ children }) => {
    const { t } = useTranslation();
    const [languageModal, setLanguageModal] = useState<boolean>(false)
    const handleLanguagePress = () => {
        setLanguageModal(true);
    };

    useEffect(() => {
        const checkLanguage = async () => {
            const lang = await AsyncStorage.getItem(LANGUAGE_KEY);
            if (!lang) { setLanguageModal(true) }
        };
        checkLanguage();
    }, []);

    return (
        <LinearGradient colors={["#e6f0ff", "#f0f9ff"]} style={styles.container}>
            {/* 🌐 Language button in corner */}
            <TouchableOpacity style={styles.languageButton} onPress={handleLanguagePress}>
                {Icon("language" as any)(24, "#0284c7")}
            </TouchableOpacity>

            <ScrollView
                contentContainerStyle={styles.scrollContainer}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.logoContainer}>
                    <View style={styles.logoCircle}>
                        <Image
                            source={require("../../assets/images/adaptive-icon.png")}
                            style={{ width: 200, height: 200 }}
                        />
                    </View>
                    <Text style={styles.logoText}>{t("auth.sita_dairy")}</Text>
                    <Text style={styles.logoSubtext}>{t("auth.management_system")}</Text>
                </View>

                {children}

                <View style={styles.footerContainer}>
                    <Text style={styles.footerText}>
                        © 2025 {t("auth.sita_dairy_management_system")}
                    </Text>
                </View>
            </ScrollView>

            {/* Decorative bottles */}
            <View style={styles.milkBottleLeft}>
                <View style={styles.bottleNeck} />
                <View style={styles.bottleBody} />
            </View>

            <View style={styles.milkBottleRight}>
                <View style={styles.bottleNeck} />
                <View style={styles.bottleBody} />
            </View>
            <LanguageChange languageModal={languageModal} setLanguageModal={setLanguageModal} />
        </LinearGradient>
    );
};

export default AuthTemplate;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#e6f0ff",
    },
    languageButton: {
        position: "absolute",
        top: 50,
        right: 25,
        zIndex: 10,
        backgroundColor: "white",
        borderRadius: 20,
        padding: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 4,
    },
    scrollContainer: {
        flexGrow: 1,
        paddingHorizontal: 20,
        paddingBottom: 30,
    },
    logoContainer: {
        alignItems: "center",
        marginTop: 60,
        marginBottom: 30,
    },
    logoCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: "white",
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 5,
        borderWidth: 4,
        borderColor: "white",
    },
    logoText: {
        fontSize: 28,
        fontWeight: "bold",
        color: "#0c4a6e",
        marginTop: 12,
    },
    logoSubtext: {
        fontSize: 16,
        color: "#0284c7",
        fontWeight: "500",
    },
    footerContainer: {
        marginTop: 30,
        alignItems: "center",
    },
    footerText: {
        color: "#0284c7",
        fontSize: 12,
    },
    milkBottleLeft: {
        position: "absolute",
        bottom: 0,
        left: 20,
        opacity: 0.2,
        alignItems: "center",
    },
    milkBottleRight: {
        position: "absolute",
        bottom: 0,
        right: 20,
        opacity: 0.2,
        alignItems: "center",
    },
    bottleNeck: {
        width: 15,
        height: 20,
        backgroundColor: "white",
        borderTopLeftRadius: 7.5,
        borderTopRightRadius: 7.5,
        borderWidth: 1,
        borderColor: "#bae6fd",
    },
    bottleBody: {
        width: 40,
        height: 60,
        backgroundColor: "white",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        borderWidth: 1,
        borderColor: "#bae6fd",
    },
});
