import { CustomHeader } from "@/components/common/CustomHeader";
import { api } from "@/constants/api";
import { ProductOrder } from "@/constants/types";
import { orderStatusColor, orderStatusLabelKey } from "@/utils/helper";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { format } from "date-fns";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const SCREEN_HEIGHT = Dimensions.get("window").height;
const ORDER_PAGE_LIMIT = 20;

export default function AdminOrdersScreen() {
    const { t } = useTranslation();
    const [token, setToken] = useState<string>("");
    const [orders, setOrders] = useState<ProductOrder[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [refreshing, setRefreshing] = useState(false);
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [cancellingId, setCancellingId] = useState<string | null>(null);

    const [selectedOrder, setSelectedOrder] = useState<ProductOrder | null>(null);
    const [deliveryDraft, setDeliveryDraft] = useState<Record<string, number>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchToken = async () => {
            const storedToken = await AsyncStorage.getItem("token");
            setToken(storedToken ? JSON.parse(storedToken) : "");
        };
        fetchToken();
    }, []);

    const fetchOrders = useCallback(async (): Promise<void> => {
        if (!token) return;
        setLoading(true);
        try {
            const response = await fetch(
                `${api.productOrders}?activeOnly=true&limit=${ORDER_PAGE_LIMIT}&page=1`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            const data = await response.json();
            if (data.success) {
                setOrders(data.data);
                setTotalCount(data.totalCount ?? data.data.length);
                setPage(1);
            }
        } catch (error) {
            console.error("Error fetching orders:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [token]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    useFocusEffect(
        useCallback(() => {
            fetchOrders();
        }, [fetchOrders])
    );

    const loadMore = async (): Promise<void> => {
        if (!token || isLoadingMore || orders.length >= totalCount) return;
        setIsLoadingMore(true);
        try {
            const nextPage = page + 1;
            const response = await fetch(
                `${api.productOrders}?activeOnly=true&limit=${ORDER_PAGE_LIMIT}&page=${nextPage}`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            const data = await response.json();
            if (data.success) {
                setOrders((prev) => [...prev, ...data.data]);
                setTotalCount(data.totalCount ?? totalCount);
                setPage(nextPage);
            }
        } finally {
            setIsLoadingMore(false);
        }
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchOrders();
    }, [fetchOrders]);

    const openDeliveryModal = (order: ProductOrder) => {
        const draft: Record<string, number> = {};
        order.items.forEach((item) => {
            draft[item._id] = item.deliveredQuantity;
        });
        setDeliveryDraft(draft);
        setSelectedOrder(order);
    };

    const closeDeliveryModal = () => {
        setSelectedOrder(null);
        setDeliveryDraft({});
    };

    const adjustDraftQty = (itemId: string, delta: number, max: number) => {
        setDeliveryDraft((prev) => ({
            ...prev,
            [itemId]: Math.min(max, Math.max(0, (prev[itemId] ?? 0) + delta)),
        }));
    };

    const submitDelivery = async (): Promise<void> => {
        if (!selectedOrder) return;
        setIsSubmitting(true);
        try {
            const response = await fetch(
                `${api.productOrderDeliver}/${selectedOrder._id}/deliver`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        items: selectedOrder.items.map((item) => ({
                            itemId: item._id,
                            deliveredQuantity: deliveryDraft[item._id] ?? item.deliveredQuantity,
                        })),
                    }),
                }
            );
            const data = await response.json();
            if (data.success) {
                closeDeliveryModal();
                fetchOrders();
            } else {
                Alert.alert(t("common.error"), data.message || t("orders.failed_to_update_delivery"));
            }
        } catch (error) {
            Alert.alert(t("common.error"), t("orders.failed_to_update_delivery"));
        } finally {
            setIsSubmitting(false);
        }
    };

    const cancelOrder = (order: ProductOrder) => {
        Alert.alert(
            t("orders.cancel_confirm_title"),
            t("orders.cancel_confirm_message"),
            [
                { text: t("common.no"), style: "cancel" },
                {
                    text: t("common.yes"),
                    style: "destructive",
                    onPress: async () => {
                        setCancellingId(order._id);
                        try {
                            const response = await fetch(
                                `${api.productOrderCancel}/${order._id}/cancel`,
                                {
                                    method: "PATCH",
                                    headers: {
                                        "Content-Type": "application/json",
                                        Authorization: `Bearer ${token}`,
                                    },
                                }
                            );
                            const data = await response.json();
                            if (data.success) {
                                fetchOrders();
                            } else {
                                Alert.alert(
                                    t("common.error"),
                                    data.message || t("orders.failed_to_cancel_order")
                                );
                            }
                        } catch (error) {
                            Alert.alert(t("common.error"), t("orders.failed_to_cancel_order"));
                        } finally {
                            setCancellingId(null);
                        }
                    },
                },
            ]
        );
    };

    const renderOrder = ({ item }: { item: ProductOrder }) => {
        const user = typeof item.user === "object" ? item.user : null;
        const statusColor = orderStatusColor(item.status);

        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <View style={styles.userRow}>
                        {user?.profilePic ? (
                            <Image source={{ uri: user.profilePic }} style={styles.avatar} />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <Feather name="user" size={16} color="#6366F1" />
                            </View>
                        )}
                        <Text style={styles.userName}>{user?.name ?? t("payments.unknown_user")}</Text>
                    </View>
                    <View
                        style={[
                            styles.statusBadge,
                            { backgroundColor: `${statusColor}1A`, borderColor: statusColor },
                        ]}
                    >
                        <Text style={[styles.statusBadgeText, { color: statusColor }]}>
                            {t(orderStatusLabelKey(item.status))}
                        </Text>
                    </View>
                </View>

                {item.items.map((orderItem) => (
                    <View key={orderItem._id} style={styles.itemRow}>
                        <Text style={styles.itemTitle} numberOfLines={1}>
                            {orderItem.title} × {orderItem.quantity}
                        </Text>
                        <Text style={styles.itemProgress}>
                            {orderItem.deliveredQuantity}/{orderItem.quantity}
                        </Text>
                    </View>
                ))}

                <View style={styles.footerRow}>
                    <View style={styles.deliveryDateRow}>
                        <Feather name="calendar" size={12} color="#6B7280" />
                        <Text style={styles.deliveryDate}>
                            {format(new Date(item.deliveryDate), "dd MMM yyyy")}
                        </Text>
                    </View>
                    <Text style={styles.totalAmount}>₹{item.totalAmount.toFixed(2)}</Text>
                </View>

                <View style={styles.actionsRow}>
                    <TouchableOpacity style={styles.deliverButton} onPress={() => openDeliveryModal(item)}>
                        <Feather name="truck" size={14} color="#FFFFFF" />
                        <Text style={styles.deliverButtonText}>{t("orders.update_delivery")}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.cancelIconButton}
                        onPress={() => cancelOrder(item)}
                        disabled={cancellingId === item._id}
                    >
                        {cancellingId === item._id ? (
                            <ActivityIndicator size="small" color="#EF4444" />
                        ) : (
                            <Feather name="x-circle" size={18} color="#EF4444" />
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    const renderEmptyState = () => {
        if (loading) return null;
        return (
            <View style={styles.emptyContainer}>
                <Feather name="package" size={60} color="#6366F1" opacity={0.5} />
                <Text style={styles.emptyText}>{t("orders.no_orders_found")}</Text>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <CustomHeader title={t("navigation.orders")} />

            {loading && !refreshing ? (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color="#6366F1" />
                </View>
            ) : (
                <FlatList
                    data={orders}
                    renderItem={renderOrder}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={renderEmptyState}
                    onEndReachedThreshold={0.4}
                    onEndReached={loadMore}
                    ListFooterComponent={
                        isLoadingMore ? (
                            <ActivityIndicator size="small" color="#6366F1" style={{ marginVertical: 16 }} />
                        ) : null
                    }
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor="#6366F1"
                            colors={["#6366F1"]}
                        />
                    }
                />
            )}

            <Modal visible={!!selectedOrder} animationType="slide" transparent statusBarTranslucent>
                <KeyboardAvoidingView
                    style={styles.modalWrapper}
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>{t("orders.update_delivery")}</Text>
                                <TouchableOpacity onPress={closeDeliveryModal} style={styles.closeButton}>
                                    <Feather name="x" size={24} color="#64748b" />
                                </TouchableOpacity>
                            </View>

                            <ScrollView
                                style={styles.modalScroll}
                                contentContainerStyle={styles.modalScrollContent}
                                showsVerticalScrollIndicator={false}
                            >
                                {selectedOrder?.items.map((item) => {
                                    const current = deliveryDraft[item._id] ?? item.deliveredQuantity;
                                    return (
                                        <View key={item._id} style={styles.deliveryItemRow}>
                                            <View style={styles.deliveryItemInfo}>
                                                <Text style={styles.deliveryItemTitle} numberOfLines={1}>
                                                    {item.title}
                                                </Text>
                                                <Text style={styles.deliveryItemOrdered}>
                                                    {t("orders.ordered_quantity")}: {item.quantity}
                                                </Text>
                                            </View>
                                            <View style={styles.stepperRow}>
                                                <TouchableOpacity
                                                    style={styles.stepperButton}
                                                    onPress={() => adjustDraftQty(item._id, -1, item.quantity)}
                                                >
                                                    <Feather name="minus" size={14} color="#6366F1" />
                                                </TouchableOpacity>
                                                <Text style={styles.stepperValue}>{current}</Text>
                                                <TouchableOpacity
                                                    style={styles.stepperButton}
                                                    onPress={() => adjustDraftQty(item._id, 1, item.quantity)}
                                                >
                                                    <Feather name="plus" size={14} color="#6366F1" />
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    );
                                })}
                            </ScrollView>

                            <View style={styles.modalFooter}>
                                <TouchableOpacity style={styles.modalCancelButton} onPress={closeDeliveryModal}>
                                    <Text style={styles.modalCancelButtonText}>{t("common.cancel")}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.modalSaveButton}
                                    onPress={submitDelivery}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <ActivityIndicator size="small" color="#ffffff" />
                                    ) : (
                                        <Text style={styles.modalSaveButtonText}>{t("common.save")}</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F8FAFC",
    },
    loaderContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    listContainer: {
        padding: 16,
        paddingBottom: 40,
    },
    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: 14,
        padding: 14,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10,
    },
    userRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    avatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
    },
    avatarPlaceholder: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: "#EEF2FF",
        alignItems: "center",
        justifyContent: "center",
    },
    userName: {
        fontSize: 14,
        fontWeight: "600",
        color: "#111827",
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
    },
    statusBadgeText: {
        fontSize: 11,
        fontWeight: "700",
    },
    itemRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 4,
    },
    itemTitle: {
        fontSize: 14,
        color: "#374151",
        flex: 1,
        marginRight: 8,
    },
    itemProgress: {
        fontSize: 13,
        color: "#6B7280",
        fontWeight: "600",
    },
    footerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: "#F3F4F6",
    },
    deliveryDateRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    deliveryDate: {
        fontSize: 12,
        color: "#6B7280",
    },
    totalAmount: {
        fontSize: 16,
        fontWeight: "700",
        color: "#111827",
    },
    actionsRow: {
        flexDirection: "row",
        gap: 8,
        marginTop: 12,
    },
    deliverButton: {
        flex: 1,
        flexDirection: "row",
        gap: 6,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#6366F1",
        borderRadius: 10,
        paddingVertical: 10,
    },
    deliverButtonText: {
        color: "#FFFFFF",
        fontWeight: "700",
        fontSize: 13,
    },
    cancelIconButton: {
        width: 40,
        height: 40,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#EF4444",
        alignItems: "center",
        justifyContent: "center",
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingTop: 100,
    },
    emptyText: {
        fontSize: 16,
        color: "#6B7280",
        marginTop: 16,
    },
    modalWrapper: {
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
    modalTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#1e293b",
    },
    closeButton: {
        padding: 4,
        borderRadius: 8,
    },
    modalScroll: {
        maxHeight: SCREEN_HEIGHT * 0.5,
    },
    modalScrollContent: {
        padding: 20,
    },
    deliveryItemRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#f1f5f9",
    },
    deliveryItemInfo: {
        flex: 1,
        marginRight: 12,
    },
    deliveryItemTitle: {
        fontSize: 15,
        fontWeight: "600",
        color: "#111827",
    },
    deliveryItemOrdered: {
        fontSize: 12,
        color: "#6B7280",
        marginTop: 2,
    },
    stepperRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    stepperButton: {
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "#E0E7FF",
        alignItems: "center",
        justifyContent: "center",
    },
    stepperValue: {
        fontSize: 15,
        fontWeight: "700",
        color: "#111827",
        minWidth: 24,
        textAlign: "center",
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
    modalCancelButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#d1d5db",
        alignItems: "center",
        backgroundColor: "#ffffff",
    },
    modalCancelButtonText: {
        color: "#6b7280",
        fontSize: 16,
        fontWeight: "600",
    },
    modalSaveButton: {
        flex: 1,
        backgroundColor: "#16a34a",
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: "center",
    },
    modalSaveButtonText: {
        color: "white",
        fontSize: 16,
        fontWeight: "700",
    },
});
