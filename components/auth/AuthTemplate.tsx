import { LinearGradient } from 'expo-linear-gradient'
import React, { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Image, StyleSheet, Text, View } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'

type AuthTemplateProps = {
    children: ReactNode;
};

const AuthTemplate: React.FC<AuthTemplateProps> = ({ children }) => {
    const { t } = useTranslation();
    return (
        <LinearGradient colors={["#e6f0ff", "#f0f9ff"]} style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scrollContainer}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.logoContainer}>
                    <View style={styles.logoCircle}>
                        <Image
                            source={require('../../assets/images/adaptive-icon.png')}
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

            {/* Milk bottle decorations */}
            <View style={styles.milkBottleLeft}>
                <View style={styles.bottleNeck} />
                <View style={styles.bottleBody} />
            </View>

            <View style={styles.milkBottleRight}>
                <View style={styles.bottleNeck} />
                <View style={styles.bottleBody} />
            </View>
        </LinearGradient>
    )
}

export default AuthTemplate

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#e6f0ff",
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
})