import { FloatingWhatsAppButton } from "@/components/common/FloatingWhatsAppButton";
import { CategoryGrid } from "@/components/products/CategoryGrid";
import { FeaturedProductsRow } from "@/components/products/FeaturedProductsRow";
import { ProductsHomeHeader } from "@/components/products/ProductsHomeHeader";
import { api } from "@/constants/api";
import { Product, ProductCategory } from "@/constants/types";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";


export default function ProductsScreen() {
    const { t } = useTranslation();
    const { user } = useAuth();
    const { totalCount: cartCount } = useCart();
    const router = useRouter();
    const [token, setToken] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(true);
    const [products, setProducts] = useState<Product[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [walletBalance, setWalletBalance] = useState<number | null>(null);

    // Fetch token from AsyncStorage
    useEffect(() => {
        const fetchToken = async () => {
            const storedToken = await AsyncStorage.getItem("token");
            setToken(storedToken ? JSON.parse(storedToken) : "");
        };
        fetchToken();
    }, []);

    // Fetch products when token is available
    useEffect(() => {
        if (token) {
            fetchProducts();
        }
    }, [token]);

    const fetchWalletBalance = useCallback(async (): Promise<void> => {
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
            }
        } catch (error) {
            console.error('Error fetching wallet balance:', error);
        }
    }, [token]);

    useEffect(() => {
        fetchWalletBalance();
    }, [fetchWalletBalance]);

    useFocusEffect(
        useCallback(() => {
            fetchWalletBalance();
        }, [fetchWalletBalance])
    );

    // Fetch products from API
    const fetchProducts = async (): Promise<void> => {
        if (!token) return;
        try {
            setLoading(true);
            const response = await fetch(
                api.getProducts,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            if (data.success) {
                setProducts(
                    data?.product && data?.product.length > 0 ? data?.product : []
                );
            } else {
                Alert.alert(t("common.error"), data.message || t("products.failed_load_products"));
            }
        } catch (error) {
            console.error('Error fetching products:', error);
            Alert.alert(t("common.error"), t("products.failed_load_products_retry"));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Handle refresh
    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchProducts();
        fetchWalletBalance();
    }, [token, fetchWalletBalance]);

    const popularProducts = products.filter((product) => product.isPopular);

    const goToCategory = (category: ProductCategory) => {
        router.push(`/category/${category}`);
    };

    return (
        <SafeAreaView style={styles.container}>
            <ProductsHomeHeader
                name={user?.name}
                walletBalance={walletBalance}
                onWalletPress={() => router.push("/payment")}
                cartCount={cartCount}
                onCartPress={() => router.push("/cart")}
            />

            {loading && !refreshing ? (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color="#6366F1" />
                    <Text style={styles.loadingText}>{t("products.loading_products")}</Text>
                </View>
            ) : (
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor="#6366F1"
                            colors={["#6366F1"]}
                            title={t("common.pull_to_refresh")}
                            titleColor="#6B7280"
                        />
                    }
                >
                    <FeaturedProductsRow products={popularProducts} />
                    <CategoryGrid onSelect={goToCategory} />
                </ScrollView>
            )}

            <FloatingWhatsAppButton />
        </SafeAreaView>

    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F8FAFC", // Light gray background
    },
    loaderContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: "#6B7280", // Medium gray text
    },
    scrollContent: {
        paddingBottom: 40,
    },
});
