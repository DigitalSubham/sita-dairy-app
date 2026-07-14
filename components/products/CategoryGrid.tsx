import { ProductCategory, PRODUCT_CATEGORIES } from "@/constants/types";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type CategoryGridProps = {
    onSelect: (category: ProductCategory) => void;
};

export const CATEGORY_ICONS: Record<ProductCategory, keyof typeof MaterialCommunityIcons.glyphMap> = {
    Milk: "cup-water",
    Dahi: "bowl-mix",
    Ghee: "oil",
    Paneer: "cheese",
    Mawa: "cupcake",
};

export const categoryLabelKey = (category: ProductCategory): string => {
    switch (category) {
        case "Dahi":
            return "products.category_dahi";
        case "Milk":
            return "products.category_milk";
        case "Ghee":
            return "products.category_ghee";
        case "Paneer":
            return "products.category_paneer";
        case "Mawa":
            return "products.category_mawa";
    }
};

export const CategoryGrid: React.FC<CategoryGridProps> = ({ onSelect }) => {
    const { t } = useTranslation();

    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t("products.shop_by_category")}</Text>
            <View style={styles.grid}>
                {PRODUCT_CATEGORIES.map((category) => (
                    <TouchableOpacity
                        key={category}
                        style={styles.tile}
                        activeOpacity={0.7}
                        onPress={() => onSelect(category)}
                    >
                        <View style={styles.iconCircle}>
                            <MaterialCommunityIcons
                                name={CATEGORY_ICONS[category]}
                                size={26}
                                color="#6366F1"
                            />
                        </View>
                        <Text style={styles.tileLabel} numberOfLines={1}>
                            {t(categoryLabelKey(category))}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    section: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#111827",
        marginBottom: 14,
    },
    grid: {
        flexDirection: "row",
        flexWrap: "wrap",
    },
    tile: {
        width: "25%",
        alignItems: "center",
        marginBottom: 16,
    },
    iconCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: "#EEF2FF",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 6,
    },
    tileLabel: {
        fontSize: 12,
        color: "#374151",
        fontWeight: "500",
        textAlign: "center",
    },
});
