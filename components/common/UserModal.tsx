import { User } from '@/constants/types';
import { Feather } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Image, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';



type UserModalProps = {
    showUserSelector: boolean;
    setShowUserSelector: (show: boolean) => void;
    filteredUser: User[];
    selectedUser: User | null;
    setSelectedUser: (user: User | null) => void;
    updateFormData: (field: string, value: string) => void;
    weightRef?: React.RefObject<any>;
    title: string;
};

const UserModal: React.FC<UserModalProps> = ({ showUserSelector, setShowUserSelector, filteredUser, selectedUser, setSelectedUser, updateFormData, weightRef, title }) => {
    const { t } = useTranslation();
    const [searchText, setSearchText] = useState("");

    // Roster search is client-side: `filteredUser` is already the full active
    // list for this role (from the dropdown API), not a paginated page, so
    // there's nothing to round-trip to the server for.
    useEffect(() => {
        if (!showUserSelector) setSearchText("");
    }, [showUserSelector]);

    const visibleUsers = useMemo(() => {
        const query = searchText.trim().toLowerCase();
        if (!query) return filteredUser;
        return filteredUser.filter((item) => {
            const name = item.name?.toLowerCase() || "";
            const mobile = String(item.mobile || "").toLowerCase();
            const id = item.id?.toLowerCase() || "";
            const collectionCenter = item.collectionCenter?.toLowerCase() || "";
            return (
                name.includes(query) ||
                mobile.includes(query) ||
                id.includes(query) ||
                collectionCenter.includes(query)
            );
        });
    }, [filteredUser, searchText]);

    return (
        <Modal visible={showUserSelector} animationType="slide" transparent statusBarTranslucent={true}>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>{t("records.select_user_count", { title, count: visibleUsers.length })}</Text>
                        <TouchableOpacity onPress={() => {
                            setShowUserSelector(false)
                            setSelectedUser(null)
                        }}>
                            <Feather name="x" size={24} color="#64748b" />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.searchWrapper}>
                        <Feather name="search" size={16} color="#94a3b8" />
                        <TextInput
                            style={styles.searchInput}
                            placeholder={t("common.search")}
                            value={searchText}
                            onChangeText={setSearchText}
                            autoCorrect={false}
                        />
                        {searchText.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchText("")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                                <Feather name="x-circle" size={16} color="#94a3b8" />
                            </TouchableOpacity>
                        )}
                    </View>
                    <FlatList
                        data={visibleUsers}
                        keyExtractor={(item) => item._id}
                        ListEmptyComponent={
                            <Text style={styles.emptyText}>{t("common.no_results_found")}</Text>
                        }
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={[styles.userOption, selectedUser?.id === item.id && styles.userOptionSelected]}
                                onPress={() => {
                                    setSelectedUser(item)
                                    updateFormData("userId", item._id)
                                    // Sticky-rate customers always use their fixed rate, regardless
                                    // of role, instead of being computed (rate-chart for Farmers,
                                    // manual entry for Buyers).
                                    if (item.stickyRateEnabled && item.milkRate) {
                                        updateFormData("rate", item.milkRate)
                                    }
                                    if (item.role === "Buyer" && item.milkRate && item.morningMilk && item.eveningMilk) {
                                        updateFormData("rate", item.milkRate)
                                        updateFormData("weight", new Date().getHours() < 12 ? item.morningMilk : item.eveningMilk)
                                    }
                                    setShowUserSelector(false)
                                    // Focus weight after slight delay to allow modal close
                                    if (weightRef?.current) {
                                        // Focus weight after slight delay to allow modal close
                                        setTimeout(() => {
                                            weightRef.current.focus()
                                        }, 300)
                                    }
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
    searchWrapper: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginHorizontal: 20,
        marginTop: 12,
        marginBottom: 4,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#e2e8f0",
        backgroundColor: "#f8fafc",
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: "#1f2937",
        padding: 0,
    },
    emptyText: {
        textAlign: "center",
        color: "#94a3b8",
        fontSize: 14,
        paddingVertical: 24,
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
