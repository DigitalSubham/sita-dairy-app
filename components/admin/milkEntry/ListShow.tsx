import { UserCard } from '@/components/common/UserRecordsCards';
import { Feather, FontAwesome } from '@expo/vector-icons';
import React from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

type ListShowProps = {
    text: string;
    todayEntries: any[];
    setTodayEntries: React.Dispatch<React.SetStateAction<any[]>>;
    fetchTodayEntries: (
        apiEndpoint: string,
        setIsLoading: React.Dispatch<React.SetStateAction<boolean>>,
        date: any,
        shift: string,
        setEntries: React.Dispatch<React.SetStateAction<any[]>>
    ) => void;
    shift: string;
    date: string;
    isLoadingEntries: boolean;
    setIsLoadingEntries: React.Dispatch<React.SetStateAction<boolean>>;
    url: string;
};

const ListShow: React.FC<ListShowProps> = ({
    text,
    todayEntries,
    setTodayEntries,
    fetchTodayEntries,
    shift,
    date,
    isLoadingEntries,
    setIsLoadingEntries,
    url
}) => {
    return (
        <View style={styles.entriesSection}>
            <View style={styles.entriesHeader}>
                <View style={styles.entriesHeaderLeft}>
                    <FontAwesome name="list" size={18} color="#0ea5e9" />
                    <Text style={styles.entriesTitle}>Today's {text} ({shift})</Text>
                </View>
                <View style={styles.entriesStats}>
                    <Text style={styles.entriesCount}>{todayEntries.length}</Text>
                    <Text style={styles.entriesStatsText}>
                        {Array.isArray(todayEntries) && todayEntries.length > 0
                            ? `${todayEntries.reduce((sum, entry) => sum + (Number(entry.weight) || 0), 0).toFixed(1)}L`
                            : '0.0L'}
                    </Text>

                </View>
            </View>

            {<FlatList
                data={todayEntries}
                keyExtractor={(item) => item._id}
                renderItem={({ item, index }) => <UserCard item={item} index={index} />}
                numColumns={1}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[
                    styles.entriesListContainer,
                    // ensure full‑height so ListEmptyComponent can center itself
                    todayEntries.length === 0 && { flex: 1, justifyContent: 'center' }
                ]}
                refreshControl={
                    <RefreshControl refreshing={isLoadingEntries} onRefresh={() => fetchTodayEntries(url, setIsLoadingEntries, date, shift, setTodayEntries)
                    } colors={["#0ea5e9"]} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Feather name="droplet" size={32} color="#cbd5e1" />
                        <Text style={styles.emptyStateText}>No entries yet</Text>
                        <Text style={styles.emptyStateSubtext}>Add your first {shift.toLowerCase()} {text}</Text>
                    </View>
                }
            />}
        </View>
    )
}

export default ListShow

const styles = StyleSheet.create({
    entriesSection: {
        flex: 1,
        paddingHorizontal: 16,
    },
    entriesHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#e2e8f0",
        marginBottom: 12,
    },
    entriesHeaderLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    entriesTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#0c4a6e",
    },
    entriesStats: {
        alignItems: "flex-end",
    },
    entriesCount: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#0ea5e9",
    },
    entriesStatsText: {
        fontSize: 12,
        color: "#64748b",
    },
    entriesListContainer: {
        paddingBottom: 20,
    },
    entryRow: {
        justifyContent: "space-between",
    },
    emptyState: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 40,
    },
    emptyStateText: {
        fontSize: 14,
        fontWeight: "500",
        color: "#64748b",
        marginTop: 8,
    },
    emptyStateSubtext: {
        fontSize: 12,
        color: "#94a3b8",
        marginTop: 4,
    },
})