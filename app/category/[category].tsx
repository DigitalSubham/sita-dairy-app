import { CustomHeader } from "@/components/common/CustomHeader";
import { categoryLabelKey } from "@/components/products/CategoryGrid";
import { api } from "@/constants/api";
import { Product, ProductCategory } from "@/constants/types";
import { useCart } from "@/context/CartContext";
import { AntDesign, Feather, FontAwesome } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    Linking,
    Platform,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import Animated, {
    FadeInUp,
    Layout
} from 'react-native-reanimated';
import { SafeAreaView } from "react-native-safe-area-context";

export default function CategoryProductsScreen() {
    const { t } = useTranslation();
    const { category } = useLocalSearchParams<{ category: ProductCategory }>();
    const { items: cartItems, addItem } = useCart();
    const [token, setToken] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(true);
    const [products, setProducts] = useState<Product[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [favorites, setFavorites] = useState<Set<string>>(new Set());

    useEffect(() => {
        const fetchToken = async () => {
            const storedToken = await AsyncStorage.getItem("token");
            setToken(storedToken ? JSON.parse(storedToken) : "");
        };
        fetchToken();
    }, []);

    useEffect(() => {
        if (token) {
            fetchProducts();
        }
    }, [token]);

    useEffect(() => {
        const loadFavorites = async () => {
            try {
                const storedFavorites = await AsyncStorage.getItem("favorites");
                if (storedFavorites) {
                    setFavorites(new Set(JSON.parse(storedFavorites)));
                }
            } catch (error) {
                console.error('Error loading favorites:', error);
            }
        };
        loadFavorites();
    }, []);

    const saveFavorites = async (newFavorites: Set<string>) => {
        try {
            await AsyncStorage.setItem(
                "favorites",
                JSON.stringify([...newFavorites])
            );
        } catch (error) {
            console.error('Error saving favorites:', error);
        }
    };

    const toggleFavorite = (productId: string) => {
        setFavorites((prev) => {
            const newFavorites = new Set(prev);
            if (newFavorites.has(productId)) {
                newFavorites.delete(productId);
            } else {
                newFavorites.add(productId);
            }
            saveFavorites(newFavorites);
            return newFavorites;
        });
    };

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

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchProducts();
    }, [token]);

    const openWhatsApp = (product: Product) => {
        const message = `Hi, I'm interested in purchasing: ${product.title} (₹${product.price})`;
        const phoneNumber = "918892293899";

        let url = "";
        if (Platform.OS === "android") {
            url = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(
                message
            )}`;
        } else {
            url = `https://api.whatsapp.com/send?phone=${phoneNumber}&text=${encodeURIComponent(
                message
            )}`;
        }

        Linking.canOpenURL(url)
            .then((supported: any) => {
                if (supported) {
                    return Linking.openURL(url);
                } else {
                    Alert.alert(
                        t("products.whatsapp_not_installed"),
                        t("products.install_whatsapp_to_contact")
                    );
                }
            })
            .catch((err: any) => console.error("Error opening WhatsApp:", err));
    };

    const categoryProducts = products.filter((product) => product.category === category);

    const renderItem = ({ item, index }: { item: Product; index: number }) => {
        const cartItem = cartItems.find((cartEntry) => cartEntry.productId === item._id);
        return (
        <Animated.View
            entering={FadeInUp.delay(index * 100).duration(400)}
            layout={Layout.springify()}
            style={styles.productCard}
        >
            <View style={styles.cardContent}>
                <View style={styles.imageContainer}>
                    <Image
                        source={{ uri: item.thumbnail }}
                        style={styles.productImage}
                        resizeMode="cover"
                    />
                    <TouchableOpacity
                        style={[
                            styles.favoriteButton,
                            favorites.has(item._id) && styles.favoriteButtonActive,
                        ]}
                        onPress={() => toggleFavorite(item._id)}
                    >
                        <AntDesign
                            name="heart"
                            size={16}
                            color={favorites.has(item._id) ? "#FF4081" : "#6B7280"}
                        />
                    </TouchableOpacity>

                    <LinearGradient
                        colors={["rgba(0,0,0,0.7)", "rgba(0,0,0,0.5)"]}
                        style={styles.priceTag}
                    >
                        <Text style={styles.priceText}>₹{item.price}</Text>
                    </LinearGradient>
                </View>

                <View style={styles.productInfo}>
                    <View style={styles.titleRow}>
                        <Text style={styles.productTitle} numberOfLines={1}>
                            {item.title}
                        </Text>
                    </View>

                    <Text style={styles.productDescription} numberOfLines={2}>
                        {item.description}
                    </Text>

                    <View style={styles.actionRow}>
                        <TouchableOpacity
                            style={styles.buyButton}
                            onPress={() => openWhatsApp(item)}
                        >
                            <AntDesign name="message" size={18} color="#ffffff" />
                            <Text style={styles.buyButtonText}>{t("products.buy_on_whatsapp")}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.addToCartButton}
                            onPress={() => addItem(item)}
                        >
                            {cartItem ? (
                                <Text style={styles.addToCartQty}>{cartItem.quantity}</Text>
                            ) : (
                                <Feather name="shopping-cart" size={18} color="#6366F1" />
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Animated.View>
        );
    };

    const renderEmptyState = () => {
        if (loading) return null;

        return (
            <View style={styles.emptyContainer}>
                <FontAwesome
                    name="shopping-bag"
                    size={60}
                    color="#6366F1"
                    opacity={0.5}
                />
                <Text style={styles.emptyText}>{t("products.no_products_found")}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={fetchProducts}>
                    <Text style={styles.retryButtonText}>{t("common.retry")}</Text>
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <CustomHeader
                title={category ? t(categoryLabelKey(category)) : t("products.product_management")}
                showBackButton
                showMenuButton={false}
            />

            {loading && !refreshing ? (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color="#6366F1" />
                    <Text style={styles.loadingText}>{t("products.loading_products")}</Text>
                </View>
            ) : (
                <FlatList
                    data={categoryProducts}
                    renderItem={renderItem}
                    keyExtractor={(item) => item._id.toString()}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={renderEmptyState}
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
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: "#6B7280",
    },
    listContainer: {
        padding: 16,
        paddingBottom: 80,
    },
    productCard: {
        width: "100%",
        marginBottom: 16,
        borderRadius: 16,
        overflow: "hidden",
        backgroundColor: "#FFFFFF",
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    cardContent: {
        flexDirection: "row",
        height: 140,
    },
    imageContainer: {
        position: "relative",
        width: 140,
        height: "100%",
    },
    productImage: {
        width: "100%",
        height: "100%",
    },
    favoriteButton: {
        position: "absolute",
        top: 8,
        right: 8,
        zIndex: 10,
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    favoriteButtonActive: {
        backgroundColor: "rgba(255, 64, 129, 0.1)",
        borderColor: "#FF4081",
    },
    priceTag: {
        position: "absolute",
        bottom: 0,
        left: 0,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderTopRightRadius: 12,
    },
    priceText: {
        fontSize: 16,
        fontWeight: "700",
        color: "#ffffff",
    },
    productInfo: {
        flex: 1,
        padding: 12,
        justifyContent: "space-between",
    },
    titleRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 4,
    },
    productTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#111827",
        flex: 1,
        marginRight: 8,
    },
    productDescription: {
        fontSize: 12,
        color: "#6B7280",
        marginBottom: 12,
        lineHeight: 16,
    },
    actionRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    buyButton: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#6366F1",
        paddingVertical: 8,
        borderRadius: 10,
        gap: 6,
    },
    addToCartButton: {
        width: 38,
        height: 38,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#6366F1",
        alignItems: "center",
        justifyContent: "center",
    },
    addToCartQty: {
        color: "#6366F1",
        fontSize: 14,
        fontWeight: "700",
    },
    buyButtonText: {
        color: "#ffffff",
        fontSize: 14,
        fontWeight: "600",
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
        marginBottom: 16,
    },
    retryButton: {
        backgroundColor: "#6366F1",
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    retryButtonText: {
        color: "#ffffff",
        fontWeight: "600",
    },
});
