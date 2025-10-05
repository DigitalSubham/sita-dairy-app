import UserModal from '@/components/common/UserModal';
import { api } from '@/constants/api';
import useCustomers, { CustomerRole } from '@/hooks/useCustomer';
import { Feather, FontAwesome } from '@expo/vector-icons';
import DateTimePicker from "@react-native-community/datetimepicker";
import { format } from 'date-fns';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import RoleCheckBox from '../users/RoleCheckBox';


type paymentFormProps = {
    showPaymentMethodModal: boolean;
    setShowPaymentMethodModal: (show: boolean) => void;
    fetchPaymentRequests: (status: 'Paid' | 'Recieve') => Promise<void>
}
interface FormData {
    userId: string
    amount: string
    date: string
    role: CustomerRole
}
interface User {
    _id: string
    id: string
    name: string
    mobile: string
    collectionCenter: string
    profilePic: string
}

const PaymentForm: React.FC<paymentFormProps> = ({ showPaymentMethodModal, setShowPaymentMethodModal, fetchPaymentRequests }) => {
    const [errors, setErrors] = React.useState({
        user: "",
        amount: "",
        role: "",
        date: "",
        api: ""
    });
    const [isLoading, setIsLoading] = React.useState(false);
    const [showUserSelector, setShowUserSelector] = useState(false)
    const [selectedUser, setSelectedUser] = useState<User | null>(null)
    const [formData, setFormData] = useState<FormData>({
        userId: "",
        date: format(new Date(), "yyyy-MM-dd"),
        role: "Farmer",
        amount: "",
    })
    const { customers, token } = useCustomers({ role: formData.role === "Customer" ? "Buyer" : "Farmer" });
    const [showDatePicker, setShowDatePicker] = useState(false)

    const validateForm = (): boolean => {
        const newErrors: { amount: string; user: string, role: string, date: string, api: "" } = {
            amount: "",
            user: "",
            role: "",
            date: "",
            api: ""
        };
        let isValid = true;

        // Validate amount
        const amountNum = Number.parseInt(formData.amount, 10);
        if (!formData.amount || isNaN(amountNum)) {
            newErrors.amount = 'Please enter a valid amount';
            isValid = false;
        }

        // Validate UPI ID
        if (!formData.role) {
            newErrors.role = 'Please Choose role';
            isValid = false;
        }
        if (!formData.userId) {
            newErrors.user = 'Please Choose User';
            isValid = false;
        }
        if (!formData.role) {
            newErrors.role = 'Please Choose Date';
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleAdd = async () => {
        if (validateForm()) {
            setIsLoading(true);
            try {

                const requestBody = {
                    userId: formData.userId,
                    date: formData.date,
                    role: formData.role === "Farmer" ? "Paid" : "Recieve",
                    amount: formData.amount,
                }
                const response = await fetch(api.createPayment, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(requestBody),
                });
                const data = await response.json();
                if (data.success) {
                    fetchPaymentRequests(formData.role === "Farmer" ? "Paid" : "Recieve");
                    handleClose();

                } else {
                    setErrors({ ...errors, api: "Failed to add user" });
                }
            } catch (err: any) {
                setErrors({
                    ...errors, api:
                        err?.message
                            ? `Failed to create account: ${err.message}`
                            : "Failed to create account"
                });
            } finally {
                setIsLoading(false);
                // Reset form
                setFormData({ userId: "", amount: "", role: "Farmer", date: format(new Date(), "yyyy-MM-dd") });
                setErrors({ user: "", amount: "", role: "", date: "", api: "" });
            }
        }
    };


    const handleClose = () => {
        setFormData({ userId: "", amount: "", role: "Farmer", date: format(new Date(), "yyyy-MM-dd"), });
        setErrors({ user: "", amount: "", role: "", date: "", api: "" });
        setShowPaymentMethodModal(false);
        setSelectedUser(null);
    };

    const handleRoleSelect = (role: CustomerRole) => {
        setFormData({ ...formData, role });
        if (errors.role) {
            setErrors({ ...errors, role: "" });
        }
    };

    const updateFormData = (field: string, value: string) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }))
    }
    // Handle date picker change
    const onDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(false)
        if (selectedDate) {
            const dateString = format(selectedDate, "yyyy-MM-dd")
            setFormData({ ...formData, date: dateString });
        }
    }
    const getButtonText = () => {
        if (isLoading) {
            return formData.role === "Customer" ? "Receiving..." : "Adding...";
        }
        return formData.role === "Customer" ? "Receive Payment" : "Add Payment";
    };

    return (
        <View>
            <Modal
                visible={showPaymentMethodModal}
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
                                <Text style={styles.modalTitle}>Select Payment For</Text>
                                <TouchableOpacity
                                    onPress={handleClose}
                                    style={styles.closeButton}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                    <Feather name="x" size={24} color="#64748b" />
                                </TouchableOpacity>
                            </View>
                            {!!errors.api && <Text style={styles.errorText}>{errors.api}</Text>}

                            <View style={styles.formContainer}>
                                {/* Name Input */}
                                <View style={styles.inputContainer}>
                                    <Text style={styles.inputLabel}>Select Date</Text>
                                    <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.compactField}>
                                        <FontAwesome name="calendar" size={14} color="#0284c7" />
                                        <Text style={styles.compactFieldText}>{format(new Date(formData.date), "dd/MM/yyyy")}</Text>
                                    </TouchableOpacity>
                                    {errors.date ? (
                                        <Text style={styles.errorText}>{errors.date}</Text>
                                    ) : null}
                                </View>
                                <View style={styles.inputContainer}>
                                    <Text style={styles.inputLabel}>Select user</Text>
                                    <View style={styles.roleContainer}>
                                        <RoleCheckBox
                                            isSelected={false}
                                            isModified={formData.role === "Farmer"}
                                            canRemoveModification={false}
                                            handleRoleChange={() => handleRoleSelect("Farmer")}
                                            label="Farmer"
                                        />
                                        <RoleCheckBox
                                            isSelected={false}
                                            isModified={formData.role === "Customer"}
                                            canRemoveModification={false}
                                            handleRoleChange={() => handleRoleSelect("Customer")}
                                            label="Customer"
                                        />
                                    </View>
                                    {errors.role ? (
                                        <Text style={styles.errorText}>{errors.role}</Text>
                                    ) : null}
                                </View>

                                {/* amount Input */}
                                <View style={styles.inputContainer}>
                                    <Text style={styles.inputLabel}>Select user</Text>
                                    <TouchableOpacity style={styles.userSelector} onPress={() => setShowUserSelector(true)}>
                                        <FontAwesome name="user" size={16} color="#0ea5e9" />
                                        <Text style={styles.userSelectorText}>{selectedUser ? selectedUser.name : `Select ${formData.role}`}</Text>
                                        <Feather name="chevron-down" size={16} color="#64748b" />
                                    </TouchableOpacity>
                                    {errors.user ? (
                                        <Text style={styles.errorText}>{errors.user}</Text>
                                    ) : null}
                                </View>

                                {/* amount Input */}
                                <View style={styles.inputContainer}>
                                    <Text style={styles.inputLabel}>Enter Amount</Text>
                                    <TextInput
                                        placeholder="Amount"
                                        style={[
                                            styles.textInput,
                                            errors.amount ? styles.inputError : null
                                        ]}
                                        value={formData.amount}
                                        onChangeText={(text) => {
                                            setFormData({ ...formData, amount: text });
                                            if (errors.amount) {
                                                setErrors({ ...errors, amount: "" });
                                            }
                                        }}
                                        keyboardType="phone-pad"
                                        maxLength={15}
                                    />
                                    {errors.amount ? (
                                        <Text style={styles.errorText}>{errors.amount}</Text>
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
                                    onPress={handleAdd}
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
                                            {getButtonText()}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>


            {showDatePicker && (
                <DateTimePicker
                    value={new Date(formData.date)}
                    mode="date"
                    display="default"
                    onChange={onDateChange}
                    maximumDate={new Date()}
                />
            )}

            {<UserModal title={formData.role} showUserSelector={showUserSelector} setShowUserSelector={setShowUserSelector} filteredUser={customers} selectedUser={selectedUser} setSelectedUser={setSelectedUser} updateFormData={updateFormData} />}

        </View>
    )
}

export default PaymentForm

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

    modalDetails: {
        backgroundColor: '#374151',
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
        position: 'relative',
    },
    modalDetailText: {
        fontSize: 14,
        color: '#d1d5db',
        marginBottom: 6,
    },
    modalDetailLabel: {
        fontWeight: 'bold',
        color: '#ffffff',
    },
    paymentMethodText: {
        fontSize: 16,
        color: '#d1d5db',
        marginBottom: 16,
        marginTop: 8,
        textAlign: 'left',
    },
    paymentMethodButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    paymentMethodButton: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cashButton: {
        backgroundColor: '#10b981',
    },
    onlineButton: {
        backgroundColor: '#6366f1',
    },
    paymentMethodButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ffffff',
    },
    userSelector: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "white",
        borderWidth: 1,
        borderColor: "#0ea5e9",
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 12,
        gap: 8,
    },
    userSelectorText: {
        flex: 1,
        fontSize: 14,
        color: "#0c4a6e",
        fontWeight: "500",
    },
    modalButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },

    modalActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    modalButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ffffff',
    },
    compactField: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(255, 255, 255, 0.8)",
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#bae6fd",
        gap: 6,
    },
    compactFieldText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#0c4a6e",
    },

})