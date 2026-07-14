import { useCart } from "@/context/CartContext";
import { Product } from "@/constants/types";
import { Feather } from "@expo/vector-icons";
import type React from "react";
import { useTranslation } from "react-i18next";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type FeaturedProductsRowProps = {
    products: Product[];
};

export const FeaturedProductsRow: React.FC<FeaturedProductsRowProps> = ({ products }) => {
    const { t } = useTranslation();
    const { items, addItem } = useCart();

    if (products.length === 0) return null;

    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t("products.most_popular")}</Text>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {products.map((product) => {
                    const cartItem = items.find((item) => item.productId === product._id);
                    return (
                        <View key={product._id} style={styles.card}>
                            <View style={styles.imageWrapper}>
                                <Image source={{ uri: product.thumbnail }} style={styles.image} resizeMode="cover" />
                                <TouchableOpacity
                                    style={styles.addBadge}
                                    activeOpacity={0.85}
                                    onPress={() => addItem(product)}
                                >
                                    {cartItem ? (
                                        <Text style={styles.addBadgeQty}>{cartItem.quantity}</Text>
                                    ) : (
                                        <Feather name="plus" size={16} color="#FFFFFF" />
                                    )}
                                </TouchableOpacity>
                            </View>
                            <Text style={styles.title} numberOfLines={1}>
                                {product.title}
                            </Text>
                            <Text style={styles.price}>₹{product.price}</Text>
                        </View>
                    );
                })}
            </ScrollView>
        </View>
    );
};

const CARD_WIDTH = 140;

const styles = StyleSheet.create({
    section: {
        paddingTop: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#111827",
        marginBottom: 14,
        paddingHorizontal: 20,
    },
    scrollContent: {
        paddingHorizontal: 20,
        gap: 14,
    },
    card: {
        width: CARD_WIDTH,
    },
    imageWrapper: {
        width: CARD_WIDTH,
        height: CARD_WIDTH,
        borderRadius: 16,
        overflow: "hidden",
        backgroundColor: "#F3F4F6",
        marginBottom: 8,
    },
    image: {
        width: "100%",
        height: "100%",
    },
    addBadge: {
        position: "absolute",
        bottom: 8,
        right: 8,
        minWidth: 32,
        height: 32,
        paddingHorizontal: 6,
        borderRadius: 16,
        backgroundColor: "#6366F1",
        alignItems: "center",
        justifyContent: "center",
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    addBadgeQty: {
        color: "#FFFFFF",
        fontSize: 14,
        fontWeight: "700",
    },
    title: {
        fontSize: 14,
        fontWeight: "600",
        color: "#111827",
        marginBottom: 2,
    },
    price: {
        fontSize: 14,
        fontWeight: "700",
        color: "#6366F1",
    },
});
