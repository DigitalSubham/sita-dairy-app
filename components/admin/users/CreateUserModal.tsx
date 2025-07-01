import { api } from "@/constants/api";
import { Feather } from "@expo/vector-icons";
import React from "react";
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
import RoleCheckBox from "./RoleCheckBox";

type UserModalProps = {
    visible: boolean;
    onClose: () => void;
    onUserCreated: () => void;
}

const CreateUserModal: React.FC<UserModalProps> = ({
    visible,
    onClose,
    onUserCreated
}) => {

    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [userData, setUserData] = React.useState({
        name: "",
        mobile: "",
        role: "User",
    });

    const [errors, setErrors] = React.useState({
        name: "",
        mobile: "",
        role: "",
    });

    const validateForm = () => {
        const newErrors = {
            name: "",
            mobile: "",
            role: "",
        };

        if (!userData.name.trim()) {
            newErrors.name = "Name is required";
        }

        if (!userData.mobile.trim()) {
            newErrors.mobile = "Mobile number is required";
        } else if (!/^\d{10}$/.test(userData.mobile.replace(/\D/g, ''))) {
            newErrors.mobile = "Please enter a valid 10-digit mobile number";
        }

        if (!userData.role) {
            newErrors.role = "Please select a role";
        }

        setErrors(newErrors);
        return !Object.values(newErrors).some(error => error !== "");
    };

    const handleCreateUser = async () => {
        if (validateForm()) {
            setIsLoading(true);
            try {

                const requestBody = userData
                const response = await fetch(api.signup, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(requestBody),
                });
                const data = await response.json();
                if (data.success) {
                    onClose();
                    onUserCreated();

                } else {
                    setError("Failed to add user");
                }
            } catch (err: any) {
                setError(
                    err?.message
                        ? `Failed to create account: ${err.message}`
                        : "Failed to create account"
                );
            } finally {
                setIsLoading(false);
                // Reset form
                setUserData({ name: "", mobile: "", role: "" });
                setErrors({ name: "", mobile: "", role: "" });
            }



        }
    };

    const handleClose = () => {
        // Reset form when closing
        setUserData({ name: "", mobile: "", role: "User" });
        setErrors({ name: "", mobile: "", role: "" });
        onClose();
    };

    const handleRoleSelect = (role: string) => {
        setUserData({ ...userData, role });
        if (errors.role) {
            setErrors({ ...errors, role: "" });
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            statusBarTranslucent
        >
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        {/* Header */}
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Create New User</Text>
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
                                <Text style={styles.inputLabel}>Full Name</Text>
                                <TextInput
                                    placeholder="Enter full name"
                                    style={[
                                        styles.textInput,
                                        errors.name ? styles.inputError : null
                                    ]}
                                    value={userData.name}
                                    onChangeText={(text) => {
                                        setUserData({ ...userData, name: text });
                                        if (errors.name) {
                                            setErrors({ ...errors, name: "" });
                                        }
                                    }}
                                    keyboardType="default"
                                    autoCapitalize="words"
                                />
                                {errors.name ? (
                                    <Text style={styles.errorText}>{errors.name}</Text>
                                ) : null}
                            </View>

                            {/* Mobile Input */}
                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>Mobile Number</Text>
                                <TextInput
                                    placeholder="Enter mobile number"
                                    style={[
                                        styles.textInput,
                                        errors.mobile ? styles.inputError : null
                                    ]}
                                    value={userData.mobile}
                                    onChangeText={(text) => {
                                        setUserData({ ...userData, mobile: text });
                                        if (errors.mobile) {
                                            setErrors({ ...errors, mobile: "" });
                                        }
                                    }}
                                    keyboardType="phone-pad"
                                    maxLength={15}
                                />
                                {errors.mobile ? (
                                    <Text style={styles.errorText}>{errors.mobile}</Text>
                                ) : null}
                            </View>

                            {/* Role Selection */}
                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>Select Role</Text>
                                <View style={styles.roleContainer}>
                                    <RoleCheckBox
                                        isSelected={false}
                                        isModified={userData.role === "User"}
                                        canRemoveModification={false}
                                        handleRoleChange={() => handleRoleSelect("User")}
                                        label="User"
                                    />
                                    <RoleCheckBox
                                        isSelected={false}
                                        isModified={userData.role === "Farmer"}
                                        canRemoveModification={false}
                                        handleRoleChange={() => handleRoleSelect("Farmer")}
                                        label="Farmer"
                                    />
                                    <RoleCheckBox
                                        isSelected={false}
                                        isModified={userData.role === "Buyer"}
                                        canRemoveModification={false}
                                        handleRoleChange={() => handleRoleSelect("Buyer")}
                                        label="Buyer"
                                    />
                                </View>
                                {errors.role ? (
                                    <Text style={styles.errorText}>{errors.role}</Text>
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
                                onPress={handleCreateUser}
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
                                        {isLoading ? "Creating..." : "Create User"}
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

export default CreateUserModal;

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