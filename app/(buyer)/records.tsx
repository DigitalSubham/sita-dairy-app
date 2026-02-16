import DataCard from "@/components/admin/milkRecords/DataCard";
import ShiftModal from "@/components/admin/milkRecords/ShiftModal";
import FilterChip from "@/components/common/Chips";
import { BuyerDashboardHeader } from "@/components/common/HeaderVarients";
import RenderSummary from "@/components/common/RenderSummary";
import DairyLoadingScreen from "@/components/Loading";
import { api } from "@/constants/api";
import { FilterParams, MilkRecord, ShiftType } from "@/constants/types";
import { useAuth } from "@/context/AuthContext";
import { buildMarkedRange } from "@/utils/helper";
import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { format, subDays } from "date-fns";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
    Alert,
    Dimensions,
    FlatList,
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { Calendar } from "react-native-calendars";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

const { width } = Dimensions.get("window");

export default function EnhancedCustomerMilkRecords() {
    const [allEntries, setAllEntries] = useState<MilkRecord[]>([]);
    const [filteredEntries, setFilteredEntries] = useState<MilkRecord[]>([]);
    const { user } = useAuth()
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // Search state
    const [searchQuery, setSearchQuery] = useState("");

    // Filter states
    const [startDate, setStartDate] = useState<string>("");
    const [endDate, setEndDate] = useState<string>("");
    const [selectedShift, setSelectedShift] = useState<
        ShiftType | ""
    >("");

    const [markedDates, setMarkedDates] = useState<any>({});

    const [showShiftModal, setShowShiftModal] = useState(false);
    const [showDateRangeModal, setShowDateRangeModal] = useState(false);

    useEffect(() => {
        const end = format(subDays(new Date(), 1), "yyyy-MM-dd");
        const start = format(subDays(new Date(), 7), "yyyy-MM-dd");

        setStartDate(start);
        setEndDate(end);
        setMarkedDates(buildMarkedRange(start, end)); // ✅ KEY LINE

        fetchEntries({ startDate: start, endDate: end });
    }, []);


    // Client-side search on current data
    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredEntries(allEntries);
            return;
        }

        const filtered = allEntries.filter((entry) => {
            const searchLower = searchQuery.toLowerCase();
            return (
                entry.byUser.name.toLowerCase().includes(searchLower) ||
                format(new Date(entry.date), "dd MMM")
                    .toLowerCase()
                    .includes(searchLower) ||
                entry.shift.toLowerCase().includes(searchLower) ||
                entry.weight.includes(searchQuery) ||
                entry.snf && entry.snf.includes(searchQuery) ||
                entry.rate.includes(searchQuery) ||
                entry.price.includes(searchQuery) ||
                (entry.fat && entry.fat.includes(searchQuery))
            );
        });

        setFilteredEntries(filtered);
    }, [searchQuery, allEntries]);

    // Fetch entries with filters
    const fetchEntries = async (filters: FilterParams) => {
        setLoading(true);
        try {
            const storedToken = await AsyncStorage.getItem("token");
            if (!storedToken) {
                Toast.show({
                    type: "error",
                    text1: "Authentication token not found",
                });
                return;
            }

            const parsedToken = JSON.parse(storedToken);
            const queryParams = new URLSearchParams();
            if (filters.startDate) queryParams.append("startDate", filters.startDate);
            if (filters.endDate) queryParams.append("endDate", filters.endDate);
            if (user?.id) queryParams.append("userId", user?.id || "");
            if (filters.shift) queryParams.append("shift", filters.shift);
            queryParams.append("entryType", "Sell");
            const response = await fetch(`${api.getRecords}?${queryParams}`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${parsedToken}`,
                },
            });
            const data = await response.json();
            const recordsData = data.data || [];

            setAllEntries(recordsData);
            setFilteredEntries(recordsData);
        } catch (error) {
            console.error("Failed to fetch entries:", error);
            Alert.alert("Error", "Failed to fetch entries");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };



    // Apply filters with button click
    const applyFilters = () => {
        const filters: FilterParams = {};

        if (startDate && endDate) {
            filters.startDate = startDate;
            filters.endDate = endDate;
        }
        if (selectedShift) filters.shift = selectedShift;

        if (Object.keys(filters).length > 0) {
            fetchEntries(filters);
        }
    };

    const clearFilters = () => {
        const end = format(subDays(new Date(), 1), "yyyy-MM-dd");
        const start = format(subDays(new Date(), 7), "yyyy-MM-dd");

        setSearchQuery("");
        setSelectedShift("");

        setStartDate(start);
        setEndDate(end);
        setMarkedDates(buildMarkedRange(start, end));

        fetchEntries({ startDate: start, endDate: end });
    };

    // Refresh functionality
    const onRefresh = useCallback(() => {
        setRefreshing(true);
        const filters: FilterParams = {};

        if (startDate && endDate) {
            filters.startDate = startDate;
            filters.endDate = endDate;
        }

        if (selectedShift) filters.shift = selectedShift;

        fetchEntries(filters);
    }, [startDate, endDate, selectedShift]);

    useFocusEffect(
        useCallback(() => {
            clearFilters();
        }, [])
    );

    // Handle calendar date selection
    const handleDateSelect = (day: any) => {
        // Range selection logic
        if (!startDate || (startDate && endDate)) {
            // Start new range
            setStartDate(day.dateString);
            setEndDate("");
            setMarkedDates({
                [day.dateString]: {
                    startingDay: true,
                    selected: true,
                    color: "#0ea5e9",
                },
            });
        } else {
            // Complete the range
            let start = new Date(startDate);
            let end = new Date(day.dateString);

            // Swap if end date is before start date
            if (end < start) {
                const temp = start;
                start = end;
                end = temp;
                setStartDate(format(start, "yyyy-MM-dd"));
            }

            setEndDate(format(end, "yyyy-MM-dd"));

            // Mark all days in the range
            const markedDatesObj: any = {};
            const currentDate = new Date(start);

            while (currentDate <= end) {
                const dateString = format(currentDate, "yyyy-MM-dd");

                if (dateString === format(start, "yyyy-MM-dd")) {
                    markedDatesObj[dateString] = {
                        startingDay: true,
                        color: "#0ea5e9",
                        textColor: "white",
                    };
                } else if (dateString === format(end, "yyyy-MM-dd")) {
                    markedDatesObj[dateString] = {
                        endingDay: true,
                        color: "#0ea5e9",
                        textColor: "white",
                    };
                } else {
                    markedDatesObj[dateString] = {
                        color: "#bae6fd",
                        textColor: "#0369a1",
                    };
                }

                currentDate.setDate(currentDate.getDate() + 1);
            }

            setMarkedDates(markedDatesObj);
            setShowDateRangeModal(false);
        }
    };


    return (
        <SafeAreaView style={styles.container}>
            <BuyerDashboardHeader title="Subscription" desc="Subscribed to products" />
            <View style={styles.header}>
                <View style={styles.searchContainer}>
                    <MaterialIcons name="search" size={20} color="#64748b" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search entries..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholderTextColor="#94a3b8"
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery("")}>
                            <MaterialIcons name="clear" size={20} color="#64748b" />
                        </TouchableOpacity>
                    )}
                </View>
                <TouchableOpacity onPress={clearFilters} style={styles.clearButton}>
                    <MaterialIcons name="refresh" size={20} color="#0ea5e9" />
                </TouchableOpacity>
            </View>

            {/* Compact Filters */}
            <View style={styles.filtersContainer}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filtersScroll}
                >
                    <FilterChip
                        title={
                            startDate && endDate
                                ? `${format(new Date(startDate), "dd MMM")} - ${format(
                                    new Date(endDate),
                                    "dd MMM"
                                )}`
                                : "Range"
                        }
                        isActive={!!(startDate && endDate)}
                        onPress={() => {
                            setShowDateRangeModal(true);
                        }}
                        icon="date-range"
                    />
                    <FilterChip
                        title={selectedShift ? selectedShift[0] : "Shift"}
                        isActive={!!selectedShift}
                        onPress={() => setShowShiftModal(true)}
                        icon="schedule"
                    />
                </ScrollView>
            </View>
            {/* 8340544833 */}
            {/* Filter Action Buttons */}
            <View style={styles.actionButtonsContainer}>
                <TouchableOpacity style={styles.resetButton} onPress={clearFilters}>
                    <MaterialIcons name="clear-all" size={16} color="#ef4444" />
                    <Text style={styles.resetButtonText}>Reset</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.applyButton} onPress={applyFilters}>
                    <MaterialIcons name="filter-list" size={16} color="#fff" />
                    <Text style={styles.applyButtonText}>Apply Filters</Text>
                </TouchableOpacity>
            </View>

            {/* Enhanced Summary */}
            <RenderSummary filteredEntries={filteredEntries} />

            {/* Loading Indicator */}
            {loading && (
                <DairyLoadingScreen
                    loading={loading}
                    loadingText="Syncing your Milk Entries..."
                />
            )}

            {/* Entries List */}
            {!loading && (
                <FlatList
                    data={filteredEntries}
                    renderItem={({ item }) => <DataCard item={item} />}
                    keyExtractor={(item) => item._id}
                    numColumns={2}
                    columnWrapperStyle={styles.entryRow}
                    contentContainerStyle={styles.entriesList}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor="#0ea5e9"
                            colors={["#0ea5e9"]}
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <MaterialIcons name="inbox" size={48} color="#cbd5e1" />
                            <Text style={styles.emptyText}>
                                {searchQuery ? "No matching entries" : "No entries found"}
                            </Text>
                        </View>
                    }
                />
            )}

            {/* Date Range Modal with Calendar */}
            <Modal visible={showDateRangeModal} transparent animationType="fade" statusBarTranslucent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.calendarModalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Date Range</Text>
                            <TouchableOpacity onPress={() => setShowDateRangeModal(false)}>
                                <MaterialIcons name="close" size={20} color="#64748b" />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.calendarInstructions}>
                            {!startDate
                                ? "Select start date"
                                : !endDate
                                    ? "Select end date"
                                    : "Date range selected"}
                        </Text>

                        <Calendar
                            onDayPress={handleDateSelect}
                            markingType={"period"}
                            markedDates={markedDates}
                            theme={{
                                todayTextColor: "#0ea5e9",
                                arrowColor: "#0ea5e9",
                                dotColor: "#0ea5e9",
                                selectedDayBackgroundColor: "#0ea5e9",
                            }}
                        />

                        <View style={styles.rangeDisplayContainer}>
                            <View style={styles.rangeDisplayItem}>
                                <Text style={styles.rangeDisplayLabel}>Start Date:</Text>
                                <Text style={styles.rangeDisplayValue}>
                                    {startDate
                                        ? format(new Date(startDate), "dd MMM yyyy")
                                        : "Not selected"}
                                </Text>
                            </View>
                            <View style={styles.rangeDisplayItem}>
                                <Text style={styles.rangeDisplayLabel}>End Date:</Text>
                                <Text style={styles.rangeDisplayValue}>
                                    {endDate
                                        ? format(new Date(endDate), "dd MMM yyyy")
                                        : "Not selected"}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.modalButtonsRow}>
                            <TouchableOpacity
                                style={styles.modalSecondaryButton}
                                onPress={() => {
                                    setStartDate("");
                                    setEndDate("");
                                    setMarkedDates({});
                                }}
                            >
                                <Text style={styles.modalSecondaryButtonText}>Clear</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.modalButton}
                                onPress={() => setShowDateRangeModal(false)}
                            >
                                <Text style={styles.modalButtonText}>Done</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <ShiftModal selectedShift={selectedShift} setSelectedShift={setSelectedShift} setShowShiftModal={setShowShiftModal} showShiftModal={showShiftModal} />

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f8fafc",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderBottomColor: "#e2e8f0",
        gap: 12,
    },
    searchContainer: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#f8fafc",
        borderRadius: 8,
        paddingHorizontal: 12,
        height: 40,
        borderWidth: 1,
        borderColor: "#e2e8f0",
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 14,
        color: "#334155",
    },
    clearButton: {
        padding: 8,
    },
    filtersContainer: {
        backgroundColor: "#fff",
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: "#e2e8f0",
    },
    filtersScroll: {
        paddingHorizontal: 16,
        gap: 8,
    },
    filterChip: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#f8fafc",
        borderWidth: 1,
        borderColor: "#e2e8f0",
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 6,
        gap: 4,
    },
    activeFilterChip: {
        backgroundColor: "#0ea5e9",
        borderColor: "#0ea5e9",
    },
    filterChipText: {
        fontSize: 12,
        color: "#64748b",
        fontWeight: "500",
    },
    activeFilterChipText: {
        color: "#fff",
    },
    actionButtonsContainer: {
        flexDirection: "row",
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderBottomColor: "#e2e8f0",
        gap: 8,
    },
    resetButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#fef2f2",
        borderWidth: 1,
        borderColor: "#fecaca",
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 12,
        gap: 4,
        flex: 1,
    },
    resetButtonText: {
        color: "#ef4444",
        fontSize: 12,
        fontWeight: "600",
    },
    applyButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#0ea5e9",
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 12,
        gap: 4,
        flex: 2,
    },
    applyButtonText: {
        color: "#fff",
        fontSize: 12,
        fontWeight: "600",
    },
    summaryWrapper: {
        marginHorizontal: 16,
        marginVertical: 12,
    },
    summaryContainer: {
        flexDirection: "row",
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
    additionalMetrics: {
        backgroundColor: "#fff",
        borderRadius: 8,
        marginTop: 4,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: "#e2e8f0",
    },
    additionalMetricsText: {
        fontSize: 11,
        color: "#64748b",
        textAlign: "center",
    },
    entriesList: {
        paddingHorizontal: 12,
        paddingBottom: 20,
    },
    entryRow: {
        justifyContent: "space-between",
        paddingHorizontal: 4,
    },
    entryCard: {
        backgroundColor: "#fff",
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
        width: (width - 32) / 2,
        borderWidth: 1,
        borderColor: "#e2e8f0",
    },
    entryHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 6,
    },
    entryDate: {
        fontSize: 12,
        fontWeight: "600",
        color: "#334155",
    },
    shiftBadge: {
        width: 18,
        height: 18,
        borderRadius: 9,
        alignItems: "center",
        justifyContent: "center",
    },
    morningBadge: {
        backgroundColor: "#fef3c7",
    },
    eveningBadge: {
        backgroundColor: "#ddd6fe",
    },
    shiftText: {
        fontSize: 10,
        fontWeight: "bold",
        color: "#374151",
    },
    userRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 4,
        gap: 6,
    },
    userAvatar: {
        width: 16,
        height: 16,
        borderRadius: 8,
    },
    userName: {
        fontSize: 11,
        color: "#64748b",
        flex: 1,
        backgroundColor: "#f1f5f9",
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    recordTime: {
        fontSize: 10,
        color: "#94a3b8",
        marginBottom: 8,
        textAlign: "center",
    },
    entryDetails: {
        marginBottom: 8,
    },
    detailRow: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    detailValue: {
        fontSize: 11,
        fontWeight: "600",
        color: "#334155",
        flex: 1,
        textAlign: "center",
    },
    detailLabel: {
        fontSize: 9,
        color: "#64748b",
        flex: 1,
        textAlign: "center",
        marginTop: 2,
    },
    totalContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#ecfdf5",
        padding: 6,
        borderRadius: 4,
    },
    rateText: {
        fontSize: 10,
        color: "#059669",
        fontWeight: "500",
    },
    totalText: {
        fontSize: 12,
        fontWeight: "bold",
        color: "#059669",
    },
    emptyContainer: {
        alignItems: "center",
        paddingVertical: 40,
        flex: 1,
    },
    emptyText: {
        fontSize: 14,
        color: "#64748b",
        marginTop: 12,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "center",
        alignItems: "center",
    },
    modalContent: {
        backgroundColor: "#fff",
        borderRadius: 12,
        margin: 20,
        width: "80%",
        maxHeight: "60%",
    },
    calendarModalContent: {
        backgroundColor: "#fff",
        borderRadius: 12,
        margin: 20,
        width: "90%",
        maxHeight: "80%",
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#f1f5f9",
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#334155",
    },
    calendarInstructions: {
        fontSize: 14,
        color: "#64748b",
        textAlign: "center",
        paddingVertical: 8,
    },
    rangeDisplayContainer: {
        flexDirection: "row",
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: "#f1f5f9",
        justifyContent: "space-between",
    },
    rangeDisplayItem: {
        flex: 1,
    },
    rangeDisplayLabel: {
        fontSize: 12,
        color: "#64748b",
        marginBottom: 4,
    },
    rangeDisplayValue: {
        fontSize: 14,
        fontWeight: "600",
        color: "#334155",
    },
    userOptionRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    userOptionAvatar: {
        width: 24,
        height: 24,
        borderRadius: 12,
    },
    optionItem: {
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#f1f5f9",
    },
    selectedOption: {
        backgroundColor: "#f0f9ff",
    },
    optionText: {
        fontSize: 14,
        color: "#334155",
    },
    modalButtonsRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        padding: 16,
        gap: 8,
    },
    modalButton: {
        backgroundColor: "#0ea5e9",
        margin: 16,
        padding: 10,
        borderRadius: 6,
        alignItems: "center",
        flex: 1,
    },
    modalButtonText: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "600",
    },
    modalSecondaryButton: {
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#e2e8f0",
        padding: 10,
        borderRadius: 6,
        alignItems: "center",
        flex: 1,
    },
    modalSecondaryButtonText: {
        color: "#64748b",
        fontSize: 14,
        fontWeight: "600",
    },
});