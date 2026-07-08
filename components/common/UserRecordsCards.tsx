import { formatDate } from "@/utils/helper";
import { MaterialIcons } from "@expo/vector-icons";
import type React from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Image, Modal, Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";



export const UserCard = ({
    item,
    index,
    onEdit,
    onDelete,
}: {
    item: any;
    index: number;
    onEdit?: (item: any) => void;
    onDelete?: (item: any) => void;
}) => {
    const { t } = useTranslation();
    const [showActions, setShowActions] = useState(false);

    if (!item?.byUser) return null;

    const name = item.byUser?.name ?? "User";
    const profilePic =
        item.byUser?.profilePic ??
        `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}`;
    const date = formatDate(item.date);
    const snf = item.snf;
    const fat = item.fat;
    const rate = item.rate ?? 0;

    return (
        <Animated.View
            entering={FadeInUp.delay(0).duration(600)}
            style={styles.transactionItem}
        >
            <Image
                source={{ uri: profilePic }}
                style={styles.transactionprofilePic}
            />
            <View style={styles.transactionInfo}>
                <Text style={styles.transactionName}>{name}</Text>
                <Text style={styles.transactionDate}>{date}</Text>
                <Text style={styles.transactionSubInfo}>
                    {snf && fat
                        ? `SNF: ${snf}% • Fat: ₹${fat}% • Rate: ₹${rate}/L`
                        : `Rate: ₹${rate}/L`}
                </Text>
            </View>

            <View style={styles.transactionDetails}>
                <View style={styles.transactionTypeBadge}>
                    <Text style={styles.transactionTypeText}>{item.shift ?? "-"}</Text>
                </View>
                <Text style={styles.transactionAmount}>
                    {item.weight ? `${item.weight}L` : "-"}
                </Text>
                <Text style={styles.transactionPrice}>
                    ₹{Number(item.price ?? 0).toFixed(2)}
                </Text>
            </View>

            {(onEdit || onDelete) && (
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => setShowActions(true)}
                >
                    <MaterialIcons name="more-vert" size={18} color="#64748b" />
                </TouchableOpacity>
            )}

            {(onEdit || onDelete) && (
                <Modal
                    visible={showActions}
                    transparent
                    animationType="fade"
                    statusBarTranslucent
                    onRequestClose={() => setShowActions(false)}
                >
                    <TouchableOpacity
                        style={styles.optionsOverlay}
                        activeOpacity={1}
                        onPress={() => setShowActions(false)}
                    >
                        <View style={styles.optionsContent}>
                            {onEdit && (
                                <TouchableOpacity
                                    style={styles.optionButton}
                                    onPress={() => {
                                        setShowActions(false);
                                        onEdit(item);
                                    }}
                                >
                                    <MaterialIcons name="edit" size={20} color="#16a34a" />
                                    <Text style={styles.optionText}>{t("entry.edit_entry")}</Text>
                                </TouchableOpacity>
                            )}
                            {onDelete && (
                                <TouchableOpacity
                                    style={styles.optionButton}
                                    onPress={() => {
                                        setShowActions(false);
                                        onDelete(item);
                                    }}
                                >
                                    <MaterialIcons name="delete" size={20} color="#ef4444" />
                                    <Text style={[styles.optionText, styles.deleteOptionText]}>
                                        {t("entry.delete_entry")}
                                    </Text>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => setShowActions(false)}
                            >
                                <Text style={styles.cancelButtonText}>{t("common.cancel")}</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </Modal>
            )}
        </Animated.View>
    );
};


const styles = {
    transactionItem: {
        flexDirection: "row" as const,
        alignItems: "center" as const,
        backgroundColor: "#FFFFFF",
        paddingVertical: 16,
        paddingLeft: 16,
        paddingRight: 44,
        marginVertical: 4,
        borderRadius: 12,
        position: "relative" as const,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    transactionprofilePic: {
        width: 48,
        height: 48,
        borderRadius: 24,
        marginRight: 12,
    },
    transactionInfo: {
        flex: 1,
    },
    transactionName: {
        fontSize: 16,
        fontWeight: "600" as const,
        color: "#1A1A1A",
        marginBottom: 2,
    },
    transactionDate: {
        fontSize: 14,
        color: "#666666",
        marginBottom: 2,
    },
    transactionSubInfo: {
        fontSize: 12,
        color: "#888888",
    },
    transactionDetails: {
        alignItems: "flex-end" as const,
    },
    actionButton: {
        position: "absolute" as const,
        right: 8,
        top: 0,
        bottom: 0,
        justifyContent: "center" as const,
        alignItems: "center" as const,
        paddingHorizontal: 8,
    },
    optionsOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "center" as const,
        alignItems: "center" as const,
    },
    optionsContent: {
        backgroundColor: "#ffffff",
        borderRadius: 16,
        padding: 20,
        width: "80%" as const,
    },
    optionButton: {
        flexDirection: "row" as const,
        alignItems: "center" as const,
        paddingVertical: 14,
        paddingHorizontal: 12,
        borderRadius: 10,
        marginBottom: 8,
        backgroundColor: "#f8fafc",
        gap: 10,
    },
    optionText: {
        fontSize: 16,
        fontWeight: "500" as const,
        color: "#334155",
    },
    deleteOptionText: {
        color: "#ef4444",
    },
    cancelButton: {
        paddingVertical: 12,
        alignItems: "center" as const,
        marginTop: 4,
    },
    cancelButtonText: {
        fontSize: 16,
        color: "#64748b",
        fontWeight: "500" as const,
    },
    transactionTypeBadge: {
        backgroundColor: "rgba(46, 125, 50, 0.1)",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginBottom: 4,
    },
    transactionTypeText: {
        fontSize: 12,
        fontWeight: "500" as const,
        color: "#2E7D32",
    },
    transactionAmount: {
        fontSize: 16,
        fontWeight: "600" as const,
        color: "#2E7D32",
        marginBottom: 2,
    },
    transactionPrice: {
        fontSize: 14,
        fontWeight: "500" as const,
        color: "#1A1A1A",
        marginBottom: 2,
    },
    transactionTime: {
        fontSize: 12,
        color: "#888888",
    },
};