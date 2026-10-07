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
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

// The subset of a customer's fields this modal knows how to edit — deliberately
// narrower than the full Customer/User shape (no wallet, role, id, status,
// etc.; those have their own dedicated admin UI elsewhere, e.g. the
// active/negative-balance toggles and role checkboxes in customers.tsx).
export type EditableCustomer = {
  _id: string;
  name: string;
  mobile: string;
  fatherName?: string;
  address?: string;
  dailryName?: string;
  collectionCenter?: string;
};

type EditCustomerModalProps = {
  visible: EditableCustomer | null;
  onClose: () => void;
  onSaved: (updatedFields: Partial<EditableCustomer>) => void;
};

const nameRegex = /^[a-zA-Z\s]{2,}$/;
const phoneRegex = /^\d{10}$/;
const textRegex = /^.{2,}$/;

const EMPTY_FORM = {
  name: "",
  mobile: "",
  fatherName: "",
  address: "",
  dailryName: "",
  collectionCenter: "",
};

const EMPTY_ERRORS = {
  name: "",
  mobile: "",
  fatherName: "",
  address: "",
};

const EditCustomerModal: React.FC<EditCustomerModalProps> = ({
  visible,
  onClose,
  onSaved,
}) => {
  const { t } = useTranslation();
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState(EMPTY_ERRORS);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setForm({
        name: visible.name || "",
        mobile: visible.mobile || "",
        fatherName: visible.fatherName || "",
        address: visible.address || "",
        dailryName: visible.dailryName || "",
        collectionCenter: visible.collectionCenter || "",
      });
      setErrors(EMPTY_ERRORS);
    }
  }, [visible]);

  const validate = () => {
    const newErrors = { ...EMPTY_ERRORS };
    let hasErrors = false;

    if (!nameRegex.test(form.name)) {
      newErrors.name = t("validation.name");
      hasErrors = true;
    }
    if (!phoneRegex.test(form.mobile)) {
      newErrors.mobile = t("validation.mobile");
      hasErrors = true;
    }
    // fatherName/address are optional — only validate format if provided,
    // same rule as the self-service Profile screen.
    if (form.fatherName && !textRegex.test(form.fatherName)) {
      newErrors.fatherName = t("users.enter_valid_fathers_name");
      hasErrors = true;
    }
    if (form.address && !textRegex.test(form.address)) {
      newErrors.address = t("users.enter_valid_address");
      hasErrors = true;
    }

    setErrors(newErrors);
    return !hasErrors;
  };

  const handleClose = () => {
    if (isLoading) return;
    onClose();
  };

  const handleSave = async () => {
    if (!visible || !validate()) return;
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

      const response = await fetch(api.updateUser, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: visible._id,
          name: form.name,
          mobile: form.mobile,
          fatherName: form.fatherName,
          address: form.address,
          dailryName: form.dailryName,
          collectionCenter: form.collectionCenter,
        }),
      });
      const data = await response.json();
      if (data.success) {
        Toast.show({ type: "success", text1: t("users.profile_updated_successfully") });
        onSaved(form);
        onClose();
      } else {
        Toast.show({
          type: "error",
          text1: data.message || t("users.failed_to_update_profile"),
        });
      }
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: err?.message || t("common.something_wrong_retry"),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderField = (
    label: string,
    key: keyof typeof EMPTY_FORM,
    options?: { keyboardType?: "default" | "phone-pad"; maxLength?: number },
  ) => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={[
          styles.textInput,
          (errors as any)[key] ? styles.inputError : null,
        ]}
        value={form[key]}
        onChangeText={(text) => {
          setForm((prev) => ({ ...prev, [key]: text }));
          if ((errors as any)[key]) {
            setErrors((prev) => ({ ...prev, [key]: "" }));
          }
        }}
        keyboardType={options?.keyboardType || "default"}
        maxLength={options?.maxLength}
      />
      {(errors as any)[key] ? (
        <Text style={styles.errorText}>{(errors as any)[key]}</Text>
      ) : null}
    </View>
  );

  return (
    <Modal visible={!!visible} animationType="slide" transparent statusBarTranslucent>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t("users.edit_profile")}</Text>
              <TouchableOpacity
                onPress={handleClose}
                style={styles.closeButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Feather name="x" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.formContainer}
              keyboardShouldPersistTaps="handled"
            >
              {renderField(t("common.full_name"), "name")}
              {renderField(t("users.your_phone"), "mobile", {
                keyboardType: "phone-pad",
                maxLength: 10,
              })}
              {renderField(t("users.father_name"), "fatherName")}
              {renderField(t("users.address"), "address")}
              {renderField(t("users.dairy_name"), "dailryName")}
              {renderField(t("users.collection_center"), "collectionCenter")}
            </ScrollView>

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
                  <Text style={styles.saveButtonText}>{t("common.save_changes")}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default EditCustomerModal;

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
    maxHeight: "85%",
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
  modalTitle: { fontSize: 20, fontWeight: "700", color: "#1e293b" },
  closeButton: { padding: 4, borderRadius: 8 },
  scrollView: { maxHeight: 420 },
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
  inputError: { borderColor: "#ef4444", borderWidth: 2 },
  errorText: { color: "#ef4444", fontSize: 12, marginTop: 4, marginLeft: 4 },
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
