import { MilkRecord } from '@/constants/types';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MilkEntry } from '../admin/milkRecords/milkBuyRecords';

type props = {
    filteredEntries: MilkEntry[] | MilkRecord[]
}

const RenderSummary = ({ filteredEntries }: props) => {
    const totalEntries = filteredEntries.length;
    const totalAmount = filteredEntries.reduce(
        (sum: number, entry: any) => sum + parseFloat(entry.price),
        0
    );
    const totalWeight = filteredEntries.reduce(
        (sum: number, entry: any) => sum + parseFloat(entry.weight),
        0
    );
    return (
        <LinearGradient
            colors={["#0ea5e9", "#0284c7"]}
            style={styles.summaryContainer}
        >
            <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{totalEntries}</Text>
                <Text style={styles.summaryLabel}>Entries</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>₹{totalAmount.toFixed(0)}</Text>
                <Text style={styles.summaryLabel}>Amount</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{totalWeight.toFixed(1)}L</Text>
                <Text style={styles.summaryLabel}>Weight</Text>
            </View>
        </LinearGradient>
    )
}

export default RenderSummary

const styles = StyleSheet.create({
    summaryContainer: {
        flexDirection: "row",
        marginHorizontal: 16,
        marginVertical: 12,
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    summaryItem: {
        flex: 1,
        alignItems: "center",
    },
    summaryValue: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
    summaryLabel: {
        color: "rgba(255, 255, 255, 0.9)",
        fontSize: 10,
        marginTop: 2,
    },
    summaryDivider: {
        width: 1,
        backgroundColor: "rgba(255, 255, 255, 0.3)",
        marginHorizontal: 12,
    },
})