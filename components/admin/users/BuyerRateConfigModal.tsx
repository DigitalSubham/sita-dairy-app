
import { api } from '@/constants/api';
import { Customer } from '@/constants/types';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';


type BuyerRateProps = {
    visible: Customer | null;
    onClose: () => void;
    onBuyerSet: () => void;
}



const BuyerRateConfigModal: React.FC<BuyerRateProps> = ({ visible, onClose, onBuyerSet }) => {
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [buyerRateConfig, setBuyerRateConfig] = useState({
        morningMilk: visible?.morningMilk || "",
        eveningMilk: visible?.eveningMilk || "",
        milkRate: visible?.milkRate || "",
    })

    const [errors, setErrors] = React.useState({
        morningMilk: "",
        eveningMilk: "",
        milkRate: "",
    });

    useEffect(() => {
        if (visible) {
            setBuyerRateConfig({
                morningMilk: visible.morningMilk || "",
                eveningMilk: visible.eveningMilk || "",
                milkRate: visible.milkRate || "",
            });
        }
    }, [visible]);

    const validateForm = () => {
        const newErrors = {
            morningMilk: "",
            eveningMilk: "",
            milkRate: "",
        };


        if (!buyerRateConfig.milkRate || isNaN(Number(buyerRateConfig.milkRate)) || Number(buyerRateConfig.milkRate) <= 0) {
            newErrors.milkRate = "Rate per litre must be a positive number";
        }

        setErrors(newErrors);
        return !Object.values(newErrors).some(error => error !== "");
    };

    const handleBuyerSave = async () => {
        if (validateForm()) {
            setIsLoading(true);
            try {

                const storedToken = await AsyncStorage.getItem("token");
                if (!storedToken) {
                    Toast.show({
                        type: "error",
                        text1: "Authentication token not found",
                    });
                    return;
                }
                const parsedToken = JSON.parse(storedToken);
                const requestBody = { ...buyerRateConfig, userId: visible?._id }
                const response = await fetch(api.updateUser, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${parsedToken}`,
                    },
                    body: JSON.stringify(requestBody),
                });

                const data = await response.json();
                if (data.success) {
                    onClose();
                    onBuyerSet();
                } else {
                    setError("Failed to Set Buyer Rate Config");
                }
            } catch (err: any) {
                console.error("Error creating account:", err);
                setError(
                    err?.message
                    ?? `Failed to set rate`

                );
            } finally {
                setIsLoading(false);
                // Reset form
                setBuyerRateConfig({
                    morningMilk: "",
                    eveningMilk: "",
                    milkRate: "",
                });
                setErrors({
                    morningMilk: "",
                    eveningMilk: "",
                    milkRate: "",
                });
            }
        }
    };

    const handleClose = () => {
        // Reset form when closing
        setBuyerRateConfig({
            morningMilk: "",
            eveningMilk: "",
            milkRate: "",
        });
        setErrors({
            morningMilk: "",
            eveningMilk: "",
            milkRate: "",
        });
        onClose();
    };


    return (
        <Modal
            visible={!!visible}
            animationType="slide"
            transparent
            statusBarTranslucent={true}
        >
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        {/* Header */}
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Milk Rate - {visible?.name}</Text>
                            <TouchableOpacity
                                onPress={handleClose}
                                style={styles.closeButton}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <Feather name="x" size={24} color="#64748b" />
                            </TouchableOpacity>
                        </View>
                        {error && <Text style={styles.errorText}>{error}</Text>}

                        <View style={styles.formContainer}>
                            {/* Name Input */}
                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>Morning Milk Quantity</Text>
                                <TextInput
                                    placeholder="Enter Morning Milk Quantity"
                                    style={[
                                        styles.textInput,
                                        errors.morningMilk ? styles.inputError : null
                                    ]}
                                    value={buyerRateConfig.morningMilk}
                                    onChangeText={(text) => {
                                        setBuyerRateConfig({ ...buyerRateConfig, morningMilk: text });
                                        if (errors.morningMilk) {
                                            setErrors({ ...errors, morningMilk: "" });
                                        }
                                    }}
                                    keyboardType="default"
                                    autoCapitalize="words"
                                />

                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>Evening Milk Quantity</Text>
                                <TextInput
                                    placeholder="Enter Evening Milk Quantity"
                                    style={[
                                        styles.textInput,
                                        errors.eveningMilk ? styles.inputError : null
                                    ]}
                                    value={buyerRateConfig.eveningMilk}
                                    onChangeText={(text) => {
                                        setBuyerRateConfig({ ...buyerRateConfig, eveningMilk: text });
                                        if (errors.eveningMilk) {
                                            setErrors({ ...errors, eveningMilk: "" });
                                        }
                                    }}
                                    keyboardType="default"
                                    autoCapitalize="words"
                                />

                            </View>



                            {/* Rate Input */}
                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>Milk Rate</Text>
                                <TextInput
                                    placeholder="Milk Rate per Litre"
                                    style={[
                                        styles.textInput,
                                        errors.eveningMilk ? styles.inputError : null
                                    ]}
                                    value={buyerRateConfig.milkRate.toString()}
                                    onChangeText={(text) => {
                                        setBuyerRateConfig({ ...buyerRateConfig, milkRate: text.toString() });
                                        if (errors.milkRate) {
                                            setErrors({ ...errors, milkRate: "" });
                                        }
                                    }}
                                    keyboardType="phone-pad"
                                    maxLength={15}
                                />
                                {errors.milkRate ? (
                                    <Text style={styles.errorText}>{errors.milkRate}</Text>
                                ) : null}
                            </View>
                        </View>


                        {/* Footer with buttons */}
                        <View style={styles.modalFooter}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={handleClose}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.createButton,
                                    isLoading && styles.loadingButton
                                ]}
                                onPress={handleBuyerSave}
                                disabled={isLoading}
                            >
                                <View style={styles.buttonContent}>
                                    {isLoading && (
                                        <ActivityIndicator
                                            size="small"
                                            color="white"
                                            style={styles.loader}
                                        />
                                    )}
                                    <Text style={[
                                        styles.createButtonText,
                                        isLoading && styles.loadingButtonText
                                    ]}>
                                        {isLoading ? "Saving..." : "Save"}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    )
}

export default BuyerRateConfigModal

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
        shadowOffset: {
            width: 0,
            height: 2,
        },
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
        flex: 1,
    },
    formContainer: {
        padding: 20,
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
    textInput: {
        borderWidth: 1,
        borderColor: "#d1d5db",
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        backgroundColor: "#ffffff",
        color: "#1f2937",
    },
    inputError: {
        borderColor: "#ef4444",
        borderWidth: 2,
    },
    errorText: {
        color: "#ef4444",
        fontSize: 14,
        marginTop: 4,
        marginLeft: 4,
    },
    roleContainer: {
        flexDirection: "row",
        justifyContent: "space-between",

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
        backgroundColor: "#0ea5e9",
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        alignItems: "center",
        elevation: 2,
        shadowColor: "#0ea5e9",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    createButtonText: {
        color: "white",
        fontSize: 16,
        fontWeight: "700",
    },
    loadingButton: {
        backgroundColor: "#0284c7",
        opacity: 0.8,
    },
    loadingButtonText: {
        marginLeft: 8,
    },
    buttonContent: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },
    loader: {
        marginRight: 8,
    },
    disabledButton: {
        opacity: 0.5,
    },
    disabledText: {
        color: "#9ca3af",
    },
});