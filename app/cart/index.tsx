import { CustomHeader } from "@/components/common/CustomHeader";
import { api } from "@/constants/api";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import { format } from "date-fns";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CartScreen() {
    const { t } = useTranslation();
    const { user } = useAuth();
    const router = useRouter();
    const { items, updateQuantity, removeItem, clearCart, totalAmount } = useCart();

    const [token, setToken] = useState<string>("");
    const [walletBalance, setWalletBalance] = useState<number | null>(null);
    const [allowNegativeBalance, setAllowNegativeBalance] = useState(false);
    const [deliveryDate, setDeliveryDate] = useState<Date>(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [isPlacingOrder, setIsPlacingOrder] = useState(false);

    useEffect(() => {
        const fetchToken = async () => {
            const storedToken = await AsyncStorage.getItem("token");
            setToken(storedToken ? JSON.parse(storedToken) : "");
        };
        fetchToken();
    }, []);

    useEffect(() => {
        const fetchWallet = async () => {
            if (!token) return;
            try {
                const response = await fetch(api.getUser, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                });
                const data = await response.json();
                if (data.success) {
                    setWalletBalance(data.user?.walletAmount ?? 0);
                    setAllowNegativeBalance(!!data.user?.allowNegativeBalance);
                }
            } catch (error) {
                console.error("Error fetching wallet balance:", error);
            }
        };
        fetchWallet();
    }, [token]);

    const handleDateChange = (event: any, date?: Date) => {
        setShowDatePicker(false);
        if (date) {
            setDeliveryDate(date);
        }
    };

    const insufficientBalance =
        !allowNegativeBalance &&
        walletBalance !== null &&
        walletBalance < totalAmount;

    const goToOrderHistory = () => {
        if (user?.role === "Farmer") {
            router.replace("/(tabs)/orderHistory");
        } else {
            router.replace("/(buyer)/orderHistory");
        }
    };

    const placeOrder = async () => {
        if (!token || items.length === 0 || insufficientBalance) return;
        setIsPlacingOrder(true);
        try {
            const response = await fetch(api.createProductOrder, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    items: items.map((item) => ({
                        productId: item.productId,
                        quantity: item.quantity,
                    })),
                    deliveryDate: format(deliveryDate, "yyyy-MM-dd"),
                }),
            });
            const data = await response.json();
            if (data.success) {
                clearCart();
                Alert.alert(t("orders.order_placed_title"), t("orders.order_placed_message"));
                goToOrderHistory();
            } else {
                Alert.alert(t("common.error"), data.message || t("orders.failed_to_place_order"));
            }
        } catch (error) {
            console.error("Error placing order:", error);
            Alert.alert(t("common.error"), t("orders.failed_to_place_order"));
        } finally {
            setIsPlacingOrder(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <CustomHeader title={t("orders.your_cart")} showBackButton showMenuButton={false} />

            {items.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Feather name="shopping-cart" size={60} color="#6366F1" opacity={0.5} />
                    <Text style={styles.emptyText}>{t("orders.empty_cart")}</Text>
                </View>
            ) : (
                <>
                    <ScrollView contentContainerStyle={styles.listContainer} showsVerticalScrollIndicator={false}>
                        {items.map((item) => (
                            <View key={item.productId} style={styles.itemCard}>
                                <Image source={{ uri: item.thumbnail }} style={styles.itemImage} resizeMode="cover" />
                                <View style={styles.itemInfo}>
                                    <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
                                    <Text style={styles.itemPrice}>₹{item.price}</Text>
                                    <View style={styles.qtyRow}>
                                        <TouchableOpacity
                                            style={styles.qtyButton}
                                            onPress={() => updateQuantity(item.productId, item.quantity - 1)}
                                        >
                                            <Feather name="minus" size={14} color="#6366F1" />
                                        </TouchableOpacity>
                                        <Text style={styles.qtyText}>{item.quantity}</Text>
                                        <TouchableOpacity
                                            style={styles.qtyButton}
                                            onPress={() => updateQuantity(item.productId, item.quantity + 1)}
                                        >
                                            <Feather name="plus" size={14} color="#6366F1" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                                <TouchableOpacity
                                    style={styles.removeButton}
                                    onPress={() => removeItem(item.productId)}
                                >
                                    <Feather name="trash-2" size={18} color="#EF4444" />
                                </TouchableOpacity>
                            </View>
                        ))}

                        <View style={styles.section}>
                            <Text style={styles.sectionLabel}>{t("orders.delivery_date")}</Text>
                            <TouchableOpacity
                                style={styles.dateButton}
                                onPress={() => setShowDatePicker(true)}
                            >
                                <Feather name="calendar" size={16} color="#6366F1" />
                                <Text style={styles.dateButtonText}>{format(deliveryDate, "dd MMM yyyy")}</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>{t("orders.total_amount")}</Text>
                            <Text style={styles.totalValue}>₹{totalAmount.toFixed(2)}</Text>
                        </View>

                        {insufficientBalance && (
                            <View style={styles.warningBox}>
                                <Feather name="alert-triangle" size={16} color="#B45309" />
                                <Text style={styles.warningText}>
                                    {t("orders.insufficient_balance", {
                                        balance: (walletBalance ?? 0).toFixed(2),
                                    })}
                                </Text>
                            </View>
                        )}
                    </ScrollView>

                    <View style={styles.footer}>
                        <TouchableOpacity
                            style={[styles.placeOrderButton, (insufficientBalance || isPlacingOrder) && styles.placeOrderButtonDisabled]}
                            onPress={placeOrder}
                            disabled={insufficientBalance || isPlacingOrder}
                        >
                            {isPlacingOrder ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <Text style={styles.placeOrderButtonText}>{t("orders.place_order")}</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </>
            )}

            {showDatePicker && (
                <DateTimePicker
                    value={deliveryDate}
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                    minimumDate={new Date()}
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
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 40,
    },
    emptyText: {
        fontSize: 16,
        color: "#6B7280",
        marginTop: 16,
        textAlign: "center",
    },
    listContainer: {
        padding: 16,
        paddingBottom: 40,
    },
    itemCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        borderRadius: 14,
        padding: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    itemImage: {
        width: 60,
        height: 60,
        borderRadius: 10,
        marginRight: 12,
    },
    itemInfo: {
        flex: 1,
    },
    itemTitle: {
        fontSize: 15,
        fontWeight: "600",
        color: "#111827",
        marginBottom: 2,
    },
    itemPrice: {
        fontSize: 14,
        fontWeight: "700",
        color: "#6366F1",
        marginBottom: 8,
    },
    qtyRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    qtyButton: {
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "#E0E7FF",
        alignItems: "center",
        justifyContent: "center",
    },
    qtyText: {
        fontSize: 15,
        fontWeight: "600",
        color: "#111827",
        minWidth: 20,
        textAlign: "center",
    },
    removeButton: {
        padding: 8,
    },
    section: {
        marginTop: 12,
        marginBottom: 16,
    },
    sectionLabel: {
        fontSize: 14,
        fontWeight: "600",
        color: "#374151",
        marginBottom: 8,
    },
    dateButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#E5E7EB",
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        alignSelf: "flex-start",
    },
    dateButtonText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#111827",
    },
    totalRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: "#E5E7EB",
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: "600",
        color: "#374151",
    },
    totalValue: {
        fontSize: 20,
        fontWeight: "700",
        color: "#111827",
    },
    warningBox: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: "#FEF3C7",
        borderWidth: 1,
        borderColor: "#FDE68A",
        borderRadius: 10,
        padding: 12,
    },
    warningText: {
        flex: 1,
        fontSize: 13,
        color: "#92400E",
    },
    footer: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: "#E5E7EB",
        backgroundColor: "#FFFFFF",
    },
    placeOrderButton: {
        backgroundColor: "#6366F1",
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: "center",
        justifyContent: "center",
    },
    placeOrderButtonDisabled: {
        opacity: 0.5,
    },
    placeOrderButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "700",
    },
});
