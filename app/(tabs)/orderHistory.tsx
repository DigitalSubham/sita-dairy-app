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
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ORDER_PAGE_LIMIT = 20;

export default function OrderHistoryScreen() {
    const { t } = useTranslation();
    const [token, setToken] = useState<string>("");
    const [orders, setOrders] = useState<ProductOrder[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [refreshing, setRefreshing] = useState(false);
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [cancellingId, setCancellingId] = useState<string | null>(null);

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
                `${api.myProductOrders}?limit=${ORDER_PAGE_LIMIT}&page=1`,
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
                `${api.myProductOrders}?limit=${ORDER_PAGE_LIMIT}&page=${nextPage}`,
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
        const statusColor = orderStatusColor(item.status);
        const deliveredQty = item.items.reduce((sum, i) => sum + i.deliveredQuantity, 0);
        const totalQty = item.items.reduce((sum, i) => sum + i.quantity, 0);

        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.orderDate}>
                        {format(new Date(item.createdAt), "dd MMM yyyy, hh:mm a")}
                    </Text>
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
                        <Text style={styles.itemAmount}>
                            ₹{(orderItem.price * orderItem.quantity).toFixed(2)}
                        </Text>
                    </View>
                ))}

                {(item.status === "Partially Delivered" || item.status === "Delivered") && (
                    <Text style={styles.deliveredHint}>
                        {t("orders.delivered_of_total", { delivered: deliveredQty, total: totalQty })}
                    </Text>
                )}

                <View style={styles.footerRow}>
                    <View style={styles.deliveryDateRow}>
                        <Feather name="calendar" size={12} color="#6B7280" />
                        <Text style={styles.deliveryDate}>
                            {format(new Date(item.deliveryDate), "dd MMM yyyy")}
                        </Text>
                    </View>
                    <Text style={styles.totalAmount}>₹{item.totalAmount.toFixed(2)}</Text>
                </View>

                {item.status === "Placed" && (
                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => cancelOrder(item)}
                        disabled={cancellingId === item._id}
                    >
                        {cancellingId === item._id ? (
                            <ActivityIndicator size="small" color="#EF4444" />
                        ) : (
                            <Text style={styles.cancelButtonText}>{t("orders.cancel_order")}</Text>
                        )}
                    </TouchableOpacity>
                )}
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
            <CustomHeader title={t("orders.order_history")} />

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
    orderDate: {
        fontSize: 12,
        color: "#6B7280",
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
    itemAmount: {
        fontSize: 14,
        color: "#111827",
        fontWeight: "600",
    },
    deliveredHint: {
        fontSize: 12,
        color: "#F59E0B",
        marginTop: 4,
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
    cancelButton: {
        marginTop: 12,
        borderWidth: 1,
        borderColor: "#EF4444",
        borderRadius: 10,
        paddingVertical: 10,
        alignItems: "center",
    },
    cancelButtonText: {
        color: "#EF4444",
        fontWeight: "700",
        fontSize: 13,
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
});
