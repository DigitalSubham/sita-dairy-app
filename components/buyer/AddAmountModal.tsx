import { api } from "@/constants/api";
import { Feather, FontAwesome } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    Dimensions,
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

const QUICK_AMOUNTS = [100, 200, 500, 1000];

export type TopupResult = "Success" | "Pending" | "Failed";

type Stage = "input" | "redirecting" | "verifying";

type AddAmountModalProps = {
    visible: boolean;
    onClose: () => void;
    token: string | null;
    onResult: (result: TopupResult, amount: number) => void;
};

const AddAmountModal: React.FC<AddAmountModalProps> = ({
    visible,
    onClose,
    token,
    onResult,
}) => {
    const { t } = useTranslation();
    const [amount, setAmount] = useState("");
    const [error, setError] = useState("");
    const [stage, setStage] = useState<Stage>("input");
    const finishWaitRef = useRef<(() => void) | null>(null);

    useEffect(() => {
        if (visible) {
            setAmount("");
            setError("");
            setStage("input");
            finishWaitRef.current = null;
        }
    }, [visible]);

    const isProcessing = stage !== "input";

    const handlePay = async () => {
        if (!token) return;
        const amountNum = Number(amount);
        if (!amount || Number.isNaN(amountNum) || amountNum <= 0) {
            setError(t("validation.amount"));
            return;
        }

        setError("");
        setStage("redirecting");
        try {
            // Resolved per-environment: an "exp://<lan-ip>:port/--/..." URL that Expo Go
            // can actually handle while developing, or the app's own "sitadairy://..."
            // scheme in a standalone/EAS build. Sent to the backend so PhonePe redirects
            // back to whichever of those is actually reachable right now.
            const returnUrl = Linking.createURL("payment-status");

            const response = await fetch(api.walletTopupInitiate, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ amount: amountNum, redirectUrl: returnUrl }),
            });
            const data = await response.json();
            if (!data.success) {
                setError(data.message || t("payments.topup_failed_to_start"));
                setStage("input");
                return;
            }

            const { redirectUrl, merchantOrderId } = data;

            // A plain browser tab (not the sandboxed "auth session" browser) is required
            // so the checkout page can hand off to an installed UPI app. That means we
            // can't rely on the browser call itself to tell us when the user is done —
            // on Android it resolves the instant the tab opens. So we wait on whichever
            // of these happens first: the redirect (Linking event, once PhonePe navigates
            // back to returnUrl), or the user tapping "I've completed the payment" below
            // as a manual fallback in case the redirect is slow or doesn't fire.
            WebBrowser.openBrowserAsync(redirectUrl).catch(() => { });

            await new Promise<void>((resolve) => {
                let settled = false;
                const finish = () => {
                    if (settled) return;
                    settled = true;
                    subscription.remove();
                    finishWaitRef.current = null;
                    resolve();
                };
                finishWaitRef.current = finish;
                const subscription = Linking.addEventListener("url", ({ url }) => {
                    if (url.startsWith(returnUrl)) {
                        finish();
                    }
                });
            });
            WebBrowser.dismissBrowser().catch(() => { });

            setStage("verifying");
            const reverifyResponse = await fetch(
                `${api.walletTopupReverify}/${merchantOrderId}/reverify`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            const reverifyData = await reverifyResponse.json();
            const status: TopupResult =
                reverifyData?.data?.status === "Success"
                    ? "Success"
                    : reverifyData?.data?.status === "Failed"
                        ? "Failed"
                        : "Pending";

            onClose();
            onResult(status, amountNum);
        } catch (err: any) {
            finishWaitRef.current = null;
            setStage("input");
            setError(
                err?.message
                    ? `${t("payments.topup_failed_to_start")}: ${err.message}`
                    : t("payments.topup_failed_to_start")
            );
        }
    };

    const handleClose = () => {
        if (stage === "verifying") return;
        finishWaitRef.current?.();
        onClose();
    };

    return (
        <Modal visible={visible} animationType="slide" transparent statusBarTranslucent>
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{t("payments.add_amount")}</Text>
                            <TouchableOpacity
                                onPress={handleClose}
                                style={styles.closeButton}
                                disabled={stage === "verifying"}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <Feather name="x" size={24} color="#64748b" />
                            </TouchableOpacity>
                        </View>

                        {isProcessing ? (
                            <View style={styles.processingContainer}>
                                <ActivityIndicator size="large" color="#3B82F6" />
                                <Text style={styles.processingText}>
                                    {stage === "redirecting"
                                        ? t("payments.opening_upi")
                                        : t("payments.verifying_payment")}
                                </Text>
                            </View>
                        ) : (
                            <>
                                {!!error && <Text style={styles.errorText}>{error}</Text>}
                                <ScrollView
                                    style={styles.scrollView}
                                    contentContainerStyle={styles.formContainer}
                                    keyboardShouldPersistTaps="handled"
                                    showsVerticalScrollIndicator={false}
                                >
                                    <Text style={styles.inputLabel}>{t("payments.enter_amount")}</Text>
                                    <View style={styles.amountInputWrapper}>
                                        <FontAwesome name="rupee" size={18} color="#10b981" />
                                        <TextInput
                                            placeholder="0.00"
                                            style={styles.textInput}
                                            value={amount}
                                            onChangeText={(text) => {
                                                setAmount(text);
                                                if (error) setError("");
                                            }}
                                            keyboardType="decimal-pad"
                                            autoFocus
                                        />
                                    </View>
                                    <Text style={styles.hintText}>{t("payments.topup_amount_hint")}</Text>

                                    <View style={styles.quickAmountsRow}>
                                        {QUICK_AMOUNTS.map((value) => (
                                            <TouchableOpacity
                                                key={value}
                                                style={[
                                                    styles.quickAmountChip,
                                                    amount === String(value) && styles.quickAmountChipActive,
                                                ]}
                                                onPress={() => {
                                                    setAmount(String(value));
                                                    if (error) setError("");
                                                }}
                                            >
                                                <Text
                                                    style={[
                                                        styles.quickAmountText,
                                                        amount === String(value) && styles.quickAmountTextActive,
                                                    ]}
                                                >
                                                    ₹{value}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </ScrollView>

                                <View style={styles.modalFooter}>
                                    <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
                                        <Text style={styles.cancelButtonText}>{t("common.cancel")}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.payButton} onPress={handlePay}>
                                        <FontAwesome name="rupee" size={16} color="white" />
                                        <Text style={styles.payButtonText}>{t("payments.pay_with_upi")}</Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

export default AddAmountModal;

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
        maxHeight: SCREEN_HEIGHT * 0.5,
    },
    formContainer: {
        padding: 20,
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: "600",
        color: "#374151",
        marginBottom: 8,
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
        fontSize: 18,
        color: "#1f2937",
    },
    hintText: {
        fontSize: 12,
        color: "#94a3b8",
        marginTop: 6,
    },
    quickAmountsRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
        marginTop: 16,
    },
    quickAmountChip: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "#e2e8f0",
        backgroundColor: "#ffffff",
    },
    quickAmountChipActive: {
        backgroundColor: "#eff6ff",
        borderColor: "#3B82F6",
    },
    quickAmountText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#64748b",
    },
    quickAmountTextActive: {
        color: "#3B82F6",
    },
    errorText: {
        color: "#ef4444",
        fontSize: 14,
        marginHorizontal: 20,
        marginTop: 12,
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
    payButton: {
        flex: 1,
        flexDirection: "row",
        gap: 8,
        backgroundColor: "#3B82F6",
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
    },
    payButtonText: {
        color: "white",
        fontSize: 16,
        fontWeight: "700",
    },
    processingContainer: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 60,
        paddingHorizontal: 20,
    },
    processingText: {
        marginTop: 16,
        fontSize: 15,
        color: "#64748b",
        fontWeight: "500",
    },
});
