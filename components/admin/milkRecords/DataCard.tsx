import { MilkEntry, MilkRecord } from '@/constants/types';
import { useAuth } from '@/context/AuthContext';
import { MaterialIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import React from 'react';
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';


const { width } = Dimensions.get("window");

type props = {
    setSelectedItem?: (value: string) => void
    setShowDeleteModal?: (value: boolean) => void
    handleEdit?: (item: MilkEntry | MilkRecord) => void
    item: MilkEntry | MilkRecord
}

const DataCard = ({ item, setSelectedItem, setShowDeleteModal, handleEdit }: props) => {
    const { user } = useAuth()
    return (
        <View style={styles.entryCard}>
            <View style={styles.entryHeader}>
                <Text style={styles.entryDate}>
                    {format(new Date(item.date), "dd MMM")}
                </Text>
                <View
                    style={[
                        styles.shiftBadge,
                        item.shift === "Morning"
                            ? styles.morningBadge
                            : styles.eveningBadge,
                    ]}
                >
                    <Text style={styles.shiftText}>{item.shift[0]}</Text>
                </View>

                {user?.role === "Admin" && <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => {
                        if (handleEdit) {
                            handleEdit(item);
                        }
                    }}
                >
                    <MaterialIcons name="edit" size={16} color="green" />
                </TouchableOpacity>}
                {user?.role === "Admin" && <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => {
                        if (setSelectedItem && setShowDeleteModal) {
                            setSelectedItem(item._id);
                            setShowDeleteModal(true);
                        }
                    }}
                >
                    <MaterialIcons name="delete" size={16} color="#ef4444" />
                </TouchableOpacity>}
            </View>

            <View style={styles.userRow}>
                <Image
                    source={{
                        uri: item?.byUser?.profilePic ?? "https://ui-avatars.com/api/?name=" +
                            encodeURIComponent(item?.byUser?.name ?? "User")
                    }}
                    style={styles.userAvatar}
                />
                <Text style={styles.userName} numberOfLines={1}>
                    {item.byUser.name}
                </Text>
            </View>

            <View style={styles.entryDetails}>
                <View style={styles.detailRow}>
                    <Text style={styles.detailValue}>{item.weight}L</Text>
                    <Text style={styles.detailValue}>{item.fat || "N/A"}%</Text>
                    <Text style={styles.detailValue}>{item.snf}%</Text>
                </View>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Weight</Text>
                    <Text style={styles.detailLabel}>Fat</Text>
                    <Text style={styles.detailLabel}>SNF</Text>
                </View>
            </View>

            <View style={styles.totalContainer}>
                <Text style={styles.rateText}>₹{item.rate}/L</Text>
                <Text style={styles.totalText}>₹{item.price}</Text>
            </View>
        </View>
    )
}

export default DataCard

const styles = StyleSheet.create({
    entryCard: {
        backgroundColor: "#fff",
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
        width: (width - 32) / 2,
        borderWidth: 1,
        borderColor: "#e2e8f0",
    },
    entryHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 6,
    },
    entryDate: {
        fontSize: 12,
        fontWeight: "600",
        color: "#334155",
    },
    shiftBadge: {
        width: 18,
        height: 18,
        borderRadius: 9,
        alignItems: "center",
        justifyContent: "center",
    },
    morningBadge: {
        backgroundColor: "#fef3c7",
    },
    eveningBadge: {
        backgroundColor: "#ddd6fe",
    },
    shiftText: {
        fontSize: 10,
        fontWeight: "bold",
        color: "#374151",
    },
    actionButton: {
        padding: 6,
        marginLeft: 8,
    },
    entryDetails: {
        marginBottom: 8,
    },
    detailRow: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    detailValue: {
        fontSize: 11,
        fontWeight: "600",
        color: "#334155",
        flex: 1,
        textAlign: "center",
    },
    detailLabel: {
        fontSize: 9,
        color: "#64748b",
        flex: 1,
        textAlign: "center",
        marginTop: 2,
    },
    totalContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#ecfdf5",
        padding: 6,
        borderRadius: 4,
    },
    rateText: {
        fontSize: 10,
        color: "#059669",
        fontWeight: "500",
    },
    totalText: {
        fontSize: 12,
        fontWeight: "bold",
        color: "#059669",
    },
    userRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
        gap: 6,
    },
    userAvatar: {
        width: 16,
        height: 16,
        borderRadius: 8,
    },
    userName: {
        fontSize: 11,
        color: "#64748b",
        flex: 1,
        backgroundColor: "#f1f5f9",
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
})