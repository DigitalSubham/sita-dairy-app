import { Feather } from '@expo/vector-icons';
import React from 'react';
import { FlatList, Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type User = {
    _id: string;
    id: string;
    name: string;
    mobile: string;
    collectionCenter: string;
    profilePic: string;
};

type UserModalProps = {
    showUserSelector: boolean;
    setShowUserSelector: (show: boolean) => void;
    filteredUser: User[];
    selectedUser: User | null;
    setSelectedUser: (user: User) => void;
    updateFormData: (field: string, value: string) => void;
    weightRef: React.RefObject<any>;
};

const UserModal: React.FC<UserModalProps> = ({ showUserSelector, setShowUserSelector, filteredUser, selectedUser, setSelectedUser, updateFormData, weightRef }) => {
    return (
        <Modal visible={showUserSelector} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Select Farmer - {filteredUser.length}</Text>
                        <TouchableOpacity onPress={() => setShowUserSelector(false)}>
                            <Feather name="x" size={24} color="#64748b" />
                        </TouchableOpacity>
                    </View>
                    <FlatList
                        data={filteredUser}
                        keyExtractor={(item) => item._id}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={[styles.userOption, selectedUser?.id === item.id && styles.userOptionSelected]}
                                onPress={() => {
                                    setSelectedUser(item)
                                    updateFormData("userId", item._id)
                                    setShowUserSelector(false)
                                    // Focus weight after slight delay to allow modal close
                                    setTimeout(() => {
                                        weightRef.current?.focus();
                                    }, 300);
                                }}
                            >
                                <View style={styles.userOptionContent}>
                                    <Image
                                        source={{
                                            uri: item.profilePic,
                                        }}
                                        style={styles.profilePic}
                                    />
                                    <View style={styles.userOptionContentColumn}>
                                        <Text style={styles.userOptionName}>{item.name}</Text>
                                        <Text style={styles.userOptionDetails}>
                                            {item.mobile} • {item.collectionCenter} • {item.id}
                                        </Text>
                                    </View>
                                </View>
                                {selectedUser?.id === item.id && (
                                    <View style={styles.selectedIndicator}>
                                        <Feather name="check" size={16} color="white" />
                                    </View>
                                )}
                            </TouchableOpacity>
                        )}
                        showsVerticalScrollIndicator={false}
                    />
                </View>
            </View>
        </Modal>
    )
}

export default UserModal

const styles = StyleSheet.create({
    profilePic: {
        width: 36,
        height: 36,
        borderRadius: 18,
        marginRight: 8,
        borderWidth: 1,
        borderColor: "#e2e8f0",
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "center",
        alignItems: "center",
    },
    modalContent: {
        backgroundColor: "white",
        borderRadius: 20,
        padding: 0,
        margin: 20,
        width: "90%",
        maxHeight: "80%",
        overflow: "hidden",
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: "#f1f5f9",
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#0c4a6e",
    },
    userOption: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: "#f1f5f9",
    },
    userOptionSelected: {
        backgroundColor: "#f0f9ff",
    },
    userOptionContent: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
    },
    userOptionContentColumn: {
        flex: 1
    },
    userOptionName: {
        fontSize: 16,
        fontWeight: "600",
        color: "#334155",
    },
    userOptionDetails: {
        fontSize: 14,
        color: "#64748b",
        marginTop: 2,
    },
    selectedIndicator: {
        backgroundColor: "#0ea5e9",
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
    },
    optionsModalContent: {
        backgroundColor: "white",
        borderRadius: 16,
        padding: 20,
        margin: 20,
        width: "80%",
    },
    optionsModalTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#0c4a6e",
        marginBottom: 20,
        textAlign: "center",
    },
    optionButton: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderRadius: 12,
        marginBottom: 8,
        backgroundColor: "#f8fafc",
    },
    deleteOptionButton: {
        backgroundColor: "#fef2f2",
    },
    optionIconContainer: {
        backgroundColor: "#f0f9ff",
        padding: 8,
        borderRadius: 8,
    },
    deleteIconContainer: {
        backgroundColor: "#fee2e2",
    },
    optionButtonText: {
        fontSize: 16,
        fontWeight: "500",
        color: "#0ea5e9",
        marginLeft: 12,
    },
    deleteOptionText: {
        color: "#ef4444",
    },
    cancelButton: {
        paddingVertical: 12,
        alignItems: "center",
        marginTop: 8,
    },
    cancelButtonText: {
        fontSize: 16,
        color: "#64748b",
        fontWeight: "500",
    },
})