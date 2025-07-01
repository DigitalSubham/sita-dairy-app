import { formatDate } from "@/utils/helper";
import type React from "react";
import { Image, Text, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";



export const UserCard = ({ item, index }: { item: any; index: number }) => {
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
        </Animated.View>
    );
};


const styles = {
    transactionItem: {
        flexDirection: "row" as const,
        alignItems: "center" as const,
        backgroundColor: "#FFFFFF",
        padding: 16,
        marginVertical: 4,
        borderRadius: 12,
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