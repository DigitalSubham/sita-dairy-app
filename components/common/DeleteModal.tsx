import { Entypo, Feather, FontAwesome } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface RenderDeleteModalProps {
  showDeleteModal: boolean;
  setShowDeleteModal: (value: boolean) => void;
  isDeleting: boolean;
  selectedItem: string | null;
  handleDelete: (couponId: string) => void;
  text: string;
}

const RenderDeleteModal = ({
  showDeleteModal,
  setShowDeleteModal,
  isDeleting,
  selectedItem,
  handleDelete,
  text,
}: RenderDeleteModalProps) => (
  <Modal
    visible={showDeleteModal}
    statusBarTranslucent={true}
    transparent
    animationType="fade"
    onRequestClose={() => setShowDeleteModal(false)}
  >
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <View style={styles.warningIconContainer}>
          <Feather name="alert-triangle" size={40} color="#FF3B30" />
        </View>

        <Text style={styles.modalTitle}>Delete {text}</Text>
        <Text style={styles.modalText}>
          Are you sure you want to delete this {text}? This action cannot be
          undone.
        </Text>

        <View style={styles.modalActions}>
          <TouchableOpacity
            style={[styles.modalButton, styles.cancelButton]}
            onPress={() => setShowDeleteModal(false)}
            disabled={isDeleting}
          >
            <Entypo name="cross" size={18} color="#374151" />
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modalButton, styles.deleteButton]}
            onPress={() => selectedItem && handleDelete(selectedItem)}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <FontAwesome name="trash" size={18} color="#ffffff" />
                <Text style={styles.deleteButtonText}>Delete</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);

export default RenderDeleteModal;

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    width: "100%",
    maxWidth: 400,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 16,
    textAlign: "center",
  },
  modalText: {
    fontSize: 16,
    color: "#6B7280",
    marginBottom: 20,
    textAlign: "center",
    lineHeight: 22,
  },
  warningIconContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    marginHorizontal: 5,
    flexDirection: "row",
    justifyContent: "center",
  },
  deleteButton: {
    backgroundColor: "#FF3B30",
  },
  cancelButton: {
    backgroundColor: "#F3F4F6",
  },
  cancelButtonText: {
    color: "#374151",
    fontWeight: "500",
    marginLeft: 6,
  },
  deleteButtonText: {
    color: "#ffffff",
    fontWeight: "600",
    marginLeft: 6,
  },
});