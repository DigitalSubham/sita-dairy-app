import { api } from "@/constants/api";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

type ResetPasswordTarget = { _id: string; name: string };

type ResetPasswordModalProps = {
  visible: ResetPasswordTarget | null;
  onClose: () => void;
};

const MIN_LENGTH = 5;

const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({
  visible,
  onClose,
}) => {
  const { t } = useTranslation();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setNewPassword("");
      setConfirmPassword("");
      setError("");
    }
  }, [visible]);

  const handleClose = () => {
    if (isLoading) return;
    onClose();
  };

  const handleSave = async () => {
    if (!visible) return;
    if (newPassword.length < MIN_LENGTH) {
      setError(t("users.password_min_length"));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t("users.passwords_do_not_match"));
      return;
    }

    setError("");
    setIsLoading(true);
    try {
      const storedToken = await AsyncStorage.getItem("token");
      const token = storedToken ? JSON.parse(storedToken) : "";
      if (!token) {
        Toast.show({
          type: "error",
          text1: t("records.authentication_token_not_found"),
        });
        return;
      }

      const response = await fetch(api.adminResetPassword, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: visible._id, newPassword }),
      });
      const data = await response.json();
      if (data.success) {
        Toast.show({
          type: "success",
          text1: t("users.password_updated_successfully"),
        });
        onClose();
      } else {
        setError(data.message || t("users.failed_to_update_password"));
      }
    } catch (err: any) {
      setError(err?.message || t("common.something_wrong_retry"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal visible={!!visible} animationType="slide" transparent statusBarTranslucent>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {t("users.reset_password")} — {visible?.name}
              </Text>
              <TouchableOpacity
                onPress={handleClose}
                style={styles.closeButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Feather name="x" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View style={styles.formContainer}>
              {!!error && <Text style={styles.errorText}>{error}</Text>}

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>{t("users.new_password")}</Text>
                <TextInput
                  style={styles.textInput}
                  value={newPassword}
                  onChangeText={(text) => {
                    setNewPassword(text);
                    if (error) setError("");
                  }}
                  secureTextEntry
                  autoCapitalize="none"
                  placeholder={t("users.new_password")}
                  placeholderTextColor="#9ca3af"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>
                  {t("users.confirm_new_password")}
                </Text>
                <TextInput
                  style={styles.textInput}
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    if (error) setError("");
                  }}
                  secureTextEntry
                  autoCapitalize="none"
                  placeholder={t("users.confirm_new_password")}
                  placeholderTextColor="#9ca3af"
                />
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleClose}
                disabled={isLoading}
              >
                <Text style={styles.cancelButtonText}>{t("common.cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, isLoading && styles.loadingButton]}
                onPress={handleSave}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>
                    {t("users.reset_password")}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default ResetPasswordModal;

const styles = StyleSheet.create({
  container: { flex: 1 },
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
    maxWidth: 420,
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
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#1e293b", flex: 1, marginRight: 12 },
  closeButton: { padding: 4, borderRadius: 8 },
  formContainer: { padding: 20 },
  inputContainer: { marginBottom: 16 },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
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
  errorText: {
    color: "#ef4444",
    fontSize: 14,
    marginBottom: 12,
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
  cancelButtonText: { color: "#6b7280", fontSize: 16, fontWeight: "600" },
  saveButton: {
    flex: 1,
    backgroundColor: "#0ea5e9",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingButton: { backgroundColor: "#0284c7", opacity: 0.8 },
  saveButtonText: { color: "white", fontSize: 16, fontWeight: "700" },
});
