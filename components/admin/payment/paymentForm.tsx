import { api } from "@/constants/api";
import { User } from "@/constants/types";
import { Feather, FontAwesome, MaterialIcons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    Dimensions,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

const SCREEN_HEIGHT = Dimensions.get("window").height;

type Direction = "Credit" | "Debit";

type PaymentFormProps = {
    visible: boolean;
    onClose: () => void;
    user: User | null;
    token: string | null;
    onSuccess: () => void;
};

const PaymentForm: React.FC<PaymentFormProps> = ({
    visible,
    onClose,
    user,
    token,
    onSuccess,
}) => {
    const { t } = useTranslation();
    const [direction, setDirection] = useState<Direction>("Credit");
    const [amount, setAmount] = useState("");
    const [note, setNote] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({ amount: "", api: "" });

    useEffect(() => {
        if (visible) {
            setDirection("Credit");
            setAmount("");
            setNote("");
            setErrors({ amount: "", api: "" });
        }
    }, [visible]);

    const validateForm = (): boolean => {
        const amountNum = Number(amount);
        if (!amount || Number.isNaN(amountNum) || amountNum <= 0) {
            setErrors({ amount: t("validation.amount"), api: "" });
            return false;
        }
        return true;
    };

    const handleSubmit = async () => {
        if (!user || !token) return;
        if (!validateForm()) return;

        setIsLoading(true);
        try {
            const response = await fetch(api.walletCashPayment, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    userId: user._id,
                    amount: Number(amount),
                    direction,
                    note: note.trim() || undefined,
                }),
            });
            const data = await response.json();
            if (data.success) {
                onSuccess();
                onClose();
            } else {
                setErrors({ amount: "", api: data.message || t("payments.failed_to_add_entry") });
            }
        } catch (err: any) {
            setErrors({
                amount: "",
                api: err?.message
                    ? `${t("payments.failed_to_add_entry")}: ${err.message}`
                    : t("payments.failed_to_add_entry"),
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent statusBarTranslucent={true}>
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{t("payments.add_entry")}</Text>
                            <TouchableOpacity
                                onPress={onClose}
                                style={styles.closeButton}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <Feather name="x" size={24} color="#64748b" />
                            </TouchableOpacity>
                        </View>

                        {!!errors.api && <Text style={styles.errorText}>{errors.api}</Text>}

                        <ScrollView
                            style={styles.scrollView}
                            contentContainerStyle={styles.formContainer}
                            keyboardShouldPersistTaps="handled"
                            showsVerticalScrollIndicator={false}
                        >
                            {user && (
                                <View style={styles.userRow}>
                                    <Image source={{ uri: user.profilePic }} style={styles.userAvatar} />
                                    <View>
                                        <Text style={styles.userName}>{user.name}</Text>
                                        <Text style={styles.userSubtext}>ID: {user.id}</Text>
                                    </View>
                                </View>
                            )}

                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>{t("payments.entry_type")}</Text>
                                <View style={styles.directionRow}>
                                    <TouchableOpacity
                                        style={[
                                            styles.directionButton,
                                            direction === "Credit" && styles.creditButtonActive,
                                        ]}
                                        onPress={() => setDirection("Credit")}
                                    >
                                        <MaterialIcons
                                            name="trending-up"
                                            size={18}
                                            color={direction === "Credit" ? "#16a34a" : "#94a3b8"}
                                        />
                                        <Text
                                            style={[
                                                styles.directionButtonText,
                                                direction === "Credit" && styles.creditButtonTextActive,
                                            ]}
                                        >
                                            {t("payments.credit")}
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[
                                            styles.directionButton,
                                            direction === "Debit" && styles.debitButtonActive,
                                        ]}
                                        onPress={() => setDirection("Debit")}
                                    >
                                        <MaterialIcons
                                            name="trending-down"
                                            size={18}
                                            color={direction === "Debit" ? "#ef4444" : "#94a3b8"}
                                        />
                                        <Text
                                            style={[
                                                styles.directionButtonText,
                                                direction === "Debit" && styles.debitButtonTextActive,
                                            ]}
                                        >
                                            {t("payments.debit")}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                                <Text style={styles.directionHint}>
                                    {direction === "Credit"
                                        ? t("payments.credit_hint")
                                        : t("payments.debit_hint")}
                                </Text>
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>{t("payments.enter_amount")}</Text>
                                <View style={styles.amountInputWrapper}>
                                    <FontAwesome name="rupee" size={16} color="#10b981" />
                                    <TextInput
                                        placeholder="0.00"
                                        style={[styles.textInput, errors.amount ? styles.inputError : null]}
                                        value={amount}
                                        onChangeText={(text) => {
                                            setAmount(text);
                                            if (errors.amount) setErrors({ ...errors, amount: "" });
                                        }}
                                        keyboardType="decimal-pad"
                                    />
                                </View>
                                {errors.amount ? <Text style={styles.errorText}>{errors.amount}</Text> : null}
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>{t("payments.remark")}</Text>
                                <TextInput
                                    placeholder={t("payments.remark_placeholder")}
                                    style={styles.noteInput}
                                    value={note}
                                    onChangeText={setNote}
                                    multiline
                                    numberOfLines={3}
                                    textAlignVertical="top"
                                />
                            </View>
                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                                <Text style={styles.cancelButtonText}>{t("common.cancel")}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.createButton,
                                    direction === "Debit" && styles.createButtonDebit,
                                    isLoading && styles.loadingButton,
                                ]}
                                onPress={handleSubmit}
                                disabled={isLoading}
                            >
                                <View style={styles.buttonContent}>
                                    {isLoading && (
                                        <ActivityIndicator size="small" color="white" style={styles.loader} />
                                    )}
                                    <Text style={styles.createButtonText}>
                                        {isLoading ? t("common.saving") : t("payments.add_entry")}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

export default PaymentForm;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    modalContent: {
        backgroundColor: "white",
        borderRadius: 16,
        width: "100%",
        maxWidth: 400,
        maxHeight: "90%",
        overflow: "hidden",
        elevation: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#f1f5f9",
        backgroundColor: "#fafafa",
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#1e293b",
    },
    closeButton: {
        padding: 4,
        borderRadius: 8,
    },
    scrollView: {
        maxHeight: SCREEN_HEIGHT * 0.55,
    },
    formContainer: {
        padding: 20,
    },
    userRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        backgroundColor: "#f8fafc",
        borderRadius: 10,
        padding: 10,
        marginBottom: 20,
    },
    userAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    userName: {
        fontSize: 15,
        fontWeight: "600",
        color: "#1e293b",
    },
    userSubtext: {
        fontSize: 12,
        color: "#64748b",
    },
    inputContainer: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: "600",
        color: "#374151",
        marginBottom: 8,
    },
    directionRow: {
        flexDirection: "row",
        gap: 10,
    },
    directionButton: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        paddingVertical: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#e2e8f0",
        backgroundColor: "#ffffff",
    },
    creditButtonActive: {
        backgroundColor: "#dcfce7",
        borderColor: "#16a34a",
    },
    debitButtonActive: {
        backgroundColor: "#fee2e2",
        borderColor: "#ef4444",
    },
    directionButtonText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#94a3b8",
    },
    creditButtonTextActive: {
        color: "#16a34a",
    },
    debitButtonTextActive: {
        color: "#ef4444",
    },
    directionHint: {
        fontSize: 12,
        color: "#94a3b8",
        marginTop: 6,
    },
    amountInputWrapper: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        borderWidth: 1,
        borderColor: "#d1d5db",
        borderRadius: 8,
        paddingHorizontal: 12,
    },
    textInput: {
        flex: 1,
        paddingVertical: 12,
        fontSize: 16,
        color: "#1f2937",
    },
    noteInput: {
        borderWidth: 1,
        borderColor: "#d1d5db",
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: "#ffffff",
        fontSize: 16,
        color: "#1f2937",
        minHeight: 80,
    },
    inputError: {
        borderColor: "#ef4444",
    },
    errorText: {
        color: "#ef4444",
        fontSize: 14,
        marginTop: 4,
        marginLeft: 4,
    },
    modalFooter: {
        flexDirection: "row",
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: "#f1f5f9",
        backgroundColor: "#fafafa",
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#d1d5db",
        alignItems: "center",
        backgroundColor: "#ffffff",
    },
    cancelButtonText: {
        color: "#6b7280",
        fontSize: 16,
        fontWeight: "600",
    },
    createButton: {
        flex: 1,
        backgroundColor: "#16a34a",
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        alignItems: "center",
    },
    createButtonDebit: {
        backgroundColor: "#ef4444",
    },
    createButtonText: {
        color: "white",
        fontSize: 16,
        fontWeight: "700",
    },
    loadingButton: {
        opacity: 0.8,
    },
    buttonContent: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },
    loader: {
        marginRight: 8,
    },
});
