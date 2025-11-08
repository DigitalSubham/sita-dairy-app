import { LANGUAGE_KEY } from "@/constants/types";
import i18n from "@/i18n";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import Icon from "./Icon";

type LanguageProps = {
    languageModal: boolean;
    setLanguageModal: (value: boolean) => void;
};

const languages = [
    { title: "English", value: "en-US", icon: "flag-outline" },
    { title: "हिन्दी", value: "hi-IN", icon: "language-outline" },
    { title: "भोजपुरी", value: "bh-IN", icon: "chatbubble-ellipses-outline" },
];

const LanguageChange: React.FC<LanguageProps> = ({
    languageModal,
    setLanguageModal,
}) => {
    const [storedLanguage, setStoredLanguage] = React.useState<string>("en-US");

    React.useEffect(() => {
        const fetchLanguage = async () => {
            const lang = await AsyncStorage.getItem(LANGUAGE_KEY);
            setStoredLanguage(lang || "en-US");
        };
        fetchLanguage();
    }, []);

    const handleLanguageChange = async (langValue: string) => {
        await AsyncStorage.setItem(LANGUAGE_KEY, langValue);
        setStoredLanguage(langValue);
        i18n.changeLanguage(langValue);
        setLanguageModal(false);
    };

    return (
        <Modal
            visible={languageModal}
            transparent
            animationType="fade"
            statusBarTranslucent
        >
            <View style={styles.modalOverlay}>
                <LinearGradient
                    colors={["#ffffff", "#f0f9ff"]}
                    style={styles.modalContent}
                >
                    {/* Header */}
                    <View style={styles.modalHeader}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                            {Icon("language" as any)(20, "#0c4a6e")}
                            <Text style={styles.modalTitle}>Select Language</Text></View>
                        <TouchableOpacity onPress={() => setLanguageModal(false)}>
                            <MaterialIcons name="close" size={22} color="#475569" />
                        </TouchableOpacity>
                    </View>

                    {/* Options */}
                    <View style={{ paddingVertical: 8 }}>
                        {languages.map((lang) => (
                            <TouchableOpacity
                                key={lang.value}
                                style={[
                                    styles.optionItem,
                                    storedLanguage === lang.value && styles.selectedOption,
                                ]}
                                onPress={() => handleLanguageChange(lang.value)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.optionLeft}>
                                    <Ionicons
                                        name={lang.icon as any}
                                        size={20}
                                        color={storedLanguage === lang.value ? "#0c4a6e" : "#64748b"}
                                    />
                                    <Text
                                        style={[
                                            styles.optionText,
                                            storedLanguage === lang.value && styles.selectedText,
                                        ]}
                                    >
                                        {lang.title}
                                    </Text>
                                </View>

                                {storedLanguage === lang.value && (
                                    <Ionicons
                                        name="checkmark-circle"
                                        size={22}
                                        color="#0284c7"
                                        style={{ marginLeft: 4 }}
                                    />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </LinearGradient>
            </View>
        </Modal>
    );
};

export default LanguageChange;

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.35)",
        justifyContent: "center",
        alignItems: "center",
    },
    modalContent: {
        width: "85%",
        borderRadius: 16,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowOffset: { width: 0, height: 3 },
        shadowRadius: 8,
        elevation: 8,
        backgroundColor: "white",
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 18,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: "#e2e8f0",
    },
    modalTitle: {
        fontSize: 17,
        fontWeight: "600",
        color: "#0f172a",
    },
    optionItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 18,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: "#f1f5f9",
    },
    optionLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    optionText: {
        fontSize: 15,
        color: "#334155",
    },
    selectedOption: {
        backgroundColor: "#e0f2fe",
    },
    selectedText: {
        color: "#0c4a6e",
        fontWeight: "600",
    },
});
