import { BuyerDashboardHeader } from "@/components/common/HeaderVarients";
import { api } from "@/constants/api";
import { Product } from "@/constants/types";
import { AntDesign, FontAwesome } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useEffect, useState } from "react";
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


export default function ProductsScreen() {
    const [token, setToken] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(true);
    const [products, setProducts] = useState<Product[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [favorites, setFavorites] = useState<Set<string>>(new Set());

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

    // Load favorites from storage
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

    // Save favorites to storage
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

    // Toggle favorite status
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
                Alert.alert("Error", data.message || "Failed to load products");
            }
        } catch (error) {
            console.error('Error fetching products:', error);
            Alert.alert("Error", "Failed to load products. Please try again.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Handle refresh
    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchProducts();
    }, [token]);

    // Open WhatsApp with product details
    const openWhatsApp = (product: Product) => {
        const message = `Hi, I'm interested in purchasing: ${product.title} (₹${product.price})`;
        const phoneNumber = "918892293899"; // Replace with your actual WhatsApp number

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
                        "WhatsApp Not Installed",
                        "Please install WhatsApp to contact us about this product."
                    );
                }
            })
            .catch((err: any) => console.error("Error opening WhatsApp:", err));
    };

    // Render product item
    const renderItem = ({ item, index }: { item: Product; index: number }) => (
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

                    {/* Price tag with gradient background to ensure visibility */}
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

                    <TouchableOpacity
                        style={styles.buyButton}
                        onPress={() => openWhatsApp(item)}
                    >
                        <AntDesign name="message" size={18} color="#ffffff" />
                        <Text style={styles.buyButtonText}>Buy on WhatsApp</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Animated.View>
    );



    // Render empty state
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
                <Text style={styles.emptyText}>No products found</Text>
                <TouchableOpacity style={styles.retryButton} onPress={fetchProducts}>
                    <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>

            <BuyerDashboardHeader title="Products" desc="Discover our exclusive collection" />



            {loading && !refreshing ? (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color="#6366F1" />
                    <Text style={styles.loadingText}>Loading products...</Text>
                </View>
            ) : (
                <FlatList
                    data={products}
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
                            title="Pull to refresh"
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
    listContainer: {
        padding: 16,
        paddingBottom: 80,
    },
    headerContainer: {
        paddingTop: 50,
        paddingHorizontal: 16,
        paddingBottom: 16,
        backgroundColor: "#FFFFFF", // White header background
        borderBottomWidth: 1,
        borderBottomColor: "#E5E7EB", // Light border
    },
    headerContent: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 10,
    },
    backButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#F3F4F6", // Light gray button background
        alignItems: "center",
        justifyContent: "center",
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: "700",
        color: "#111827", // Dark gray text
    },
    placeholder: {
        width: 36,
    },
    headerSubtitle: {
        fontSize: 14,
        color: "#6B7280", // Medium gray text
        textAlign: "center",
        marginBottom: 10,
    },
    productCard: {
        width: "100%",
        marginBottom: 16,
        borderRadius: 16,
        overflow: "hidden",
        backgroundColor: "#FFFFFF", // White card background
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        borderWidth: 1,
        borderColor: "#E5E7EB", // Light border
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
        backgroundColor: "rgba(255, 255, 255, 0.9)", // Light background
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    favoriteButtonActive: {
        backgroundColor: "rgba(255, 64, 129, 0.1)", // Light pink background
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
        color: "#111827", // Dark gray text
        flex: 1,
        marginRight: 8,
    },
    ratingContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FEF3C7", // Light yellow background
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#FDE68A",
    },
    ratingText: {
        fontSize: 12,
        color: "#92400E", // Dark yellow text
        marginLeft: 4,
        fontWeight: "500",
    },
    productDescription: {
        fontSize: 12,
        color: "#6B7280", // Medium gray text
        marginBottom: 12,
        lineHeight: 16,
    },
    buyButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#6366F1", // Keep the primary button color
        paddingVertical: 8,
        borderRadius: 10,
        gap: 6,
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
        color: "#6B7280", // Medium gray text
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
