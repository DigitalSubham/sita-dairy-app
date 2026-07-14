import FilterChip from "@/components/common/Chips";
import { CustomHeader } from "@/components/common/CustomHeader";
import UserModal from "@/components/common/UserModal";
import DairyLoadingScreen from "@/components/Loading";
import { api } from "@/constants/api";
import { ProductOrder, ProductOrderStatus, User } from "@/constants/types";
import useCustomers from "@/hooks/useCustomer";
import { orderStatusColor, orderStatusLabelKey } from "@/utils/helper";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import { format } from "date-fns";
import { useFocusEffect } from "expo-router";
import type React from "react";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    FlatList,
    Image,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ORDER_PAGE_LIMIT = 20;

type StatusFilter = "All" | ProductOrderStatus;
const STATUS_FILTERS: StatusFilter[] = ["All", "Placed", "Partially Delivered", "Delivered", "Cancelled"];

export default function AdminOrderHistoryScreen(): React.ReactElement {
    const { t } = useTranslation();
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [showUserSelector, setShowUserSelector] = useState(false);
    const [selectedDate, setSelectedDate] = useState<string>("");
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [token, setToken] = useState<string>("");
    const [orders, setOrders] = useState<ProductOrder[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    const { customers } = useCustomers({});

    const buildOrdersUrl = (pageNum: number) => {
        const params = new URLSearchParams({
            limit: String(ORDER_PAGE_LIMIT),
            page: String(pageNum),
        });
        if (statusFilter !== "All") params.append("status", statusFilter);
        if (selectedUser) params.append("userId", selectedUser._id);
        if (selectedDate) {
            params.append("startDate", selectedDate);
            params.append("endDate", selectedDate);
        }
        return `${api.productOrders}?${params.toString()}`;
    };

    const fetchOrders = useCallback(async () => {
        const storedToken = await AsyncStorage.getItem("token");
        const parsedToken = storedToken ? JSON.parse(storedToken) : "";
        setToken(parsedToken);
        if (!parsedToken) return;

        setLoading(true);
        try {
            const response = await fetch(buildOrdersUrl(1), {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${parsedToken}`,
                },
            });
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
    }, [statusFilter, selectedUser, selectedDate]);

    useFocusEffect(
        useCallback(() => {
            fetchOrders();
        }, [fetchOrders])
    );

    const loadMoreOrders = async () => {
        if (!token || isLoadingMore) return;
        if (orders.length >= totalCount) return;

        setIsLoadingMore(true);
        try {
            const nextPage = page + 1;
            const response = await fetch(buildOrdersUrl(nextPage), {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });
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

    const resetPagination = () => {
        setOrders([]);
        setPage(1);
        setTotalCount(0);
    };

    const handleStatusFilterChange = (status: StatusFilter) => {
        if (status === statusFilter) return;
        setStatusFilter(status);
        resetPagination();
    };

    const handleUserFilterChange = (user: User | null) => {
        setSelectedUser(user);
        resetPagination();
    };

    const handleDateChange = (event: any, date?: Date) => {
        setShowDatePicker(false);
        if (date) {
            setSelectedDate(format(date, "yyyy-MM-dd"));
            resetPagination();
        }
    };

    const hasActiveFilters = statusFilter !== "All" || !!selectedUser || !!selectedDate;

    const clearAllFilters = () => {
        setStatusFilter("All");
        setSelectedUser(null);
        setSelectedDate("");
        resetPagination();
    };

    const renderOrder = ({ item }: { item: ProductOrder }) => {
        const user = typeof item.user === "object" ? item.user : null;
        const statusColor = orderStatusColor(item.status);

        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    {user?.profilePic ? (
                        <Image source={{ uri: user.profilePic }} style={styles.userAvatar} />
                    ) : (
                        <View style={[styles.orderIcon, { backgroundColor: `${statusColor}26` }]}>
                            <Feather name="package" size={20} color={statusColor} />
                        </View>
                    )}
                    <View style={styles.userInfo}>
                        <Text style={styles.userName}>{user?.name ?? t("payments.unknown_user")}</Text>
                        <Text style={styles.orderMeta}>
                            {format(new Date(item.createdAt), "dd MMM yyyy, hh:mm a")}
                        </Text>
                    </View>
                    <View
                        style={[
                            styles.statusBadge,
                            { backgroundColor: `${statusColor}26`, borderColor: statusColor },
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
                    <Text style={styles.deliveryDate}>
                        {format(new Date(item.deliveryDate), "dd MMM yyyy")}
                    </Text>
                    <Text style={styles.totalAmount}>₹{item.totalAmount.toFixed(2)}</Text>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <CustomHeader title={t("navigation.order_history")} />

            <View style={styles.filterRow}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterScroll}
                >
                    {STATUS_FILTERS.map((status) => (
                        <TouchableOpacity
                            key={status}
                            style={[styles.filterTab, statusFilter === status && styles.filterTabActive]}
                            onPress={() => handleStatusFilterChange(status)}
                        >
                            <Text
                                style={[
                                    styles.filterTabText,
                                    statusFilter === status && styles.filterTabTextActive,
                                ]}
                            >
                                {status === "All" ? t("common.all") : t(orderStatusLabelKey(status))}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <View style={styles.chipFilterRow}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.chipFilterScroll}
                >
                    <FilterChip
                        title={selectedUser ? selectedUser.name.split(" ")[0] ?? "User" : t("payments.select_user")}
                        isActive={!!selectedUser}
                        onPress={() => setShowUserSelector(true)}
                        icon="person"
                    />
                    <FilterChip
                        title={selectedDate ? format(new Date(selectedDate), "dd MMM yyyy") : t("common.select_date")}
                        isActive={!!selectedDate}
                        onPress={() => setShowDatePicker(true)}
                        icon="event"
                    />
                    {hasActiveFilters && (
                        <TouchableOpacity style={styles.resetButton} onPress={clearAllFilters}>
                            <MaterialIcons name="clear-all" size={16} color="#ef4444" />
                            <Text style={styles.resetButtonText}>{t("common.reset")}</Text>
                        </TouchableOpacity>
                    )}
                </ScrollView>
            </View>

            {loading ? (
                <DairyLoadingScreen loading loadingText={t("orders.loading_orders")} />
            ) : (
                <FlatList
                    data={orders}
                    renderItem={renderOrder}
                    keyExtractor={(item: ProductOrder) => item._id}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor="#007AFF"
                            colors={["#007AFF"]}
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>{t("common.no_results_found")}</Text>
                        </View>
                    }
                    ListFooterComponent={
                        orders.length < totalCount ? (
                            <TouchableOpacity
                                style={styles.loadMoreButton}
                                onPress={loadMoreOrders}
                                disabled={isLoadingMore}
                            >
                                {isLoadingMore ? (
                                    <ActivityIndicator size="small" color="#0ea5e9" />
                                ) : (
                                    <Text style={styles.loadMoreText}>{t("payments.load_more")}</Text>
                                )}
                            </TouchableOpacity>
                        ) : null
                    }
                />
            )}

            <UserModal
                title={t("payments.select_user")}
                showUserSelector={showUserSelector}
                setShowUserSelector={setShowUserSelector}
                filteredUser={customers}
                selectedUser={selectedUser}
                setSelectedUser={handleUserFilterChange}
                updateFormData={() => { }}
            />

            {showDatePicker && (
                <DateTimePicker
                    value={selectedDate ? new Date(selectedDate) : new Date()}
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                    maximumDate={new Date()}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f8fafc",
    },
    filterRow: {
        backgroundColor: "#d9dee6ff",
        paddingVertical: 12,
    },
    filterScroll: {
        paddingHorizontal: 12,
        gap: 8,
    },
    filterTab: {
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 16,
        backgroundColor: "#ffffff",
        borderWidth: 1,
        borderColor: "#cbd5e1",
    },
    filterTabActive: {
        backgroundColor: "#0ea5e9",
        borderColor: "#0ea5e9",
    },
    filterTabText: {
        fontSize: 13,
        fontWeight: "600",
        color: "#475569",
    },
    filterTabTextActive: {
        color: "#ffffff",
    },
    chipFilterRow: {
        backgroundColor: "#ffffff",
        borderBottomWidth: 1,
        borderBottomColor: "#e2e8f0",
        paddingVertical: 10,
    },
    chipFilterScroll: {
        paddingHorizontal: 12,
        gap: 8,
        alignItems: "center",
    },
    resetButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fef2f2",
        borderWidth: 1,
        borderColor: "#fecaca",
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 6,
        gap: 4,
    },
    resetButtonText: {
        color: "#ef4444",
        fontSize: 12,
        fontWeight: "600",
    },
    listContainer: {
        padding: 16,
    },
    card: {
        backgroundColor: "#1f2937",
        borderRadius: 12,
        marginBottom: 16,
        padding: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 10,
    },
    userAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
    },
    orderIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 15,
        fontWeight: "bold",
        color: "#ffffff",
        marginBottom: 2,
    },
    orderMeta: {
        fontSize: 12,
        color: "#9ca3af",
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
        fontSize: 13,
        color: "#d1d5db",
        flex: 1,
        marginRight: 8,
    },
    itemProgress: {
        fontSize: 13,
        color: "#9ca3af",
        fontWeight: "600",
    },
    footerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: "#374151",
    },
    deliveryDate: {
        fontSize: 12,
        color: "#9ca3af",
    },
    totalAmount: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#ffffff",
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 16,
        color: "#9ca3af",
    },
    loadMoreButton: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 14,
        marginBottom: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#0ea5e9",
    },
    loadMoreText: {
        color: "#0ea5e9",
        fontWeight: "600",
        fontSize: 14,
    },
});
