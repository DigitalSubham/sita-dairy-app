import i18n from '@/i18n';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
type languageProps = {
    languageModal: boolean
    setLanguageModal: (value: boolean) => void
}
const LanguageChange: React.FC<languageProps> = ({ languageModal, setLanguageModal }) => {
    const LANGUAGE_KEY = "APP_LANGUAGE";
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

        // Change language in i18n
        i18n.changeLanguage(langValue);

        setLanguageModal(false);
    };

    return (
        <Modal visible={languageModal} transparent animationType="fade" statusBarTranslucent={true}>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Select Language</Text>
                        <TouchableOpacity onPress={() => setLanguageModal(false)}>
                            <MaterialIcons name="close" size={20} color="#64748b" />
                        </TouchableOpacity>
                    </View>
                    {[
                        { title: "Hindi", value: "hi-IN" },
                        { title: "Bhojpuri", value: "bh-IN" },
                        { title: "English", value: "en-US" }
                    ].map((lang) => (
                        <TouchableOpacity
                            key={lang.value}
                            style={[
                                styles.optionItem,
                                storedLanguage === lang.value && styles.selectedOption
                            ]}
                            onPress={() => handleLanguageChange(lang.value)}
                        >
                            <Text style={styles.optionText}>{lang.title}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        </Modal>
    );
};


export default LanguageChange

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "center",
        alignItems: "center",
    },
    modalContent: {
        backgroundColor: "#fff",
        borderRadius: 12,
        margin: 20,
        width: "80%",
        maxHeight: "60%",
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#f1f5f9",
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#334155",
    },
    optionItem: {
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#f1f5f9",
    },
    selectedOption: {
        backgroundColor: "#f0f9ff",
    },
    optionText: {
        fontSize: 14,
        color: "#334155",
    },
})