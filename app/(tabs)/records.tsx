import { FarmerRecordsHeader } from "@/components/common/HeaderVarients";
import DairyLoadingScreen from "@/components/Loading";
import { api } from "@/constants/api";
import { FilterParams, MilkRecord, ShiftType } from "@/constants/types";
import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { format, subDays } from "date-fns";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Calendar } from "react-native-calendars";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

const { width } = Dimensions.get("window");



export default function EnhancedCustomerMilkRecords() {
  const [allEntries, setAllEntries] = useState<MilkRecord[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<MilkRecord[]>([]);

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");

  // Filter states
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedShift, setSelectedShift] = useState<
    ShiftType | ""
  >("");

  // Calendar selection state
  const [calendarMode, setCalendarMode] = useState<"single" | "range">(
    "single"
  );
  const [markedDates, setMarkedDates] = useState<any>({});

  // Modal states
  const [showDateModal, setShowDateModal] = useState(false);
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [showDateRangeModal, setShowDateRangeModal] = useState(false);

  const [summary, setSummary] = useState({
    totalQuantity: 0,
    totalAmount: 0,
    morningQuantity: 0,
    eveningQuantity: 0,
    averageFat: 0,
    averageSNF: 0,
    totalEntries: 0,
  });

  // Initialize with today's date
  useEffect(() => {
    const today = format(new Date(), "yyyy-MM-dd");
    setSelectedDate(today);

    // Mark today's date in calendar
    setMarkedDates({
      [today]: { selected: true, selectedColor: "#0ea5e9" },
    });

    const endDate = format(subDays(new Date(), 1), "yyyy-MM-dd");      // yesterday
    const startDate = format(subDays(new Date(), 7), "yyyy-MM-dd");    // 7 days ago from today

    fetchEntries({ startDate, endDate });
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
      if (filters.date) queryParams.append("date", filters.date);
      if (filters.userId) queryParams.append("userId", filters.userId);
      if (filters.shift) queryParams.append("shift", filters.shift);

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
      calculateSummary(recordsData);
    } catch (error) {
      console.error("Failed to fetch entries:", error);
      Alert.alert("Error", "Failed to fetch entries");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Calculate comprehensive summary
  const calculateSummary = (recordsData: MilkRecord[]) => {
    const totalQuantity = recordsData.reduce(
      (sum, record) => sum + Number.parseFloat(record.weight),
      0
    );
    const totalAmount = recordsData.reduce(
      (sum, record) => sum + Number.parseFloat(record.price),
      0
    );
    const morningRecords = recordsData.filter(
      (record) => record.shift === "Morning"
    );
    const eveningRecords = recordsData.filter(
      (record) => record.shift === "Evening"
    );
    const morningQuantity = morningRecords.reduce(
      (sum, record) => sum + Number.parseFloat(record.weight),
      0
    );
    const eveningQuantity = eveningRecords.reduce(
      (sum, record) => sum + Number.parseFloat(record.weight),
      0
    );
    const averageFat =
      recordsData.length > 0
        ? recordsData.reduce(
          (sum, record) => sum + Number.parseFloat(record.fat || "0"),
          0
        ) / recordsData.length
        : 0;
    const averageSNF =
      recordsData.length > 0
        ? recordsData.reduce(
          (sum, record) => sum + Number.parseFloat(record.snf!),
          0
        ) / recordsData.length
        : 0;

    setSummary({
      totalQuantity,
      totalAmount,
      morningQuantity,
      eveningQuantity,
      averageFat,
      averageSNF,
      totalEntries: recordsData.length,
    });
  };

  // Apply filters with button click
  const applyFilters = () => {
    const filters: FilterParams = {};

    if (startDate && endDate) {
      filters.startDate = startDate;
      filters.endDate = endDate;
    } else if (selectedDate) {
      filters.date = selectedDate;
    }

    if (selectedUser) filters.userId = selectedUser;
    if (selectedShift) filters.shift = selectedShift;

    if (Object.keys(filters).length > 0) {
      fetchEntries(filters);
    }
  };

  // Reset all filters
  const resetFilters = () => {
    setSelectedUser("");
    setSelectedDate("");
    setStartDate("");
    setEndDate("");
    setSelectedShift("");
    setSearchQuery("");

    // Reset calendar marked dates
    const today = format(new Date(), "yyyy-MM-dd");
    setMarkedDates({
      [today]: { selected: true, selectedColor: "#0ea5e9" },
    });
    setSelectedDate(today);
  };

  // Clear all filters and fetch today's data
  const clearFilters = () => {
    resetFilters();
    const endDate = format(subDays(new Date(), 1), "yyyy-MM-dd");      // yesterday
    const startDate = format(subDays(new Date(), 7), "yyyy-MM-dd");    // 7 days ago from today

    fetchEntries({ startDate, endDate });
  };

  // Refresh functionality
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    const filters: FilterParams = {};

    if (startDate && endDate) {
      filters.startDate = startDate;
      filters.endDate = endDate;
    } else if (selectedDate) {
      filters.date = selectedDate;
    }

    if (selectedUser) filters.userId = selectedUser;
    if (selectedShift) filters.shift = selectedShift;

    fetchEntries(filters);
  }, [selectedDate, startDate, endDate, selectedUser, selectedShift]);

  useFocusEffect(
    useCallback(() => {
      clearFilters();
    }, [])
  );

  // Handle calendar date selection
  const handleDateSelect = (day: any) => {
    if (calendarMode === "single") {
      const selectedDay = day.dateString;
      setSelectedDate(selectedDay);
      setStartDate("");
      setEndDate("");
      setMarkedDates({
        [selectedDay]: { selected: true, selectedColor: "#0ea5e9" },
      });
      setShowDateModal(false);
    } else {
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
        setSelectedDate("");
        setShowDateRangeModal(false);
      }
    }
  };


  // Render compact filter chip
  const FilterChip = ({
    title,
    isActive,
    onPress,
    icon,
  }: {
    title: string;
    isActive: boolean;
    onPress: () => void;
    icon: string;
  }) => (
    <TouchableOpacity
      style={[styles.filterChip, isActive && styles.activeFilterChip]}
      onPress={onPress}
    >
      <MaterialIcons
        name={icon as any}
        size={16}
        color={isActive ? "#fff" : "#0ea5e9"}
      />
      <Text
        style={[styles.filterChipText, isActive && styles.activeFilterChipText]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );



  // Render entry card with enhanced design
  const renderEntry = ({
    item,
    index,
  }: {
    item: MilkRecord;
    index: number;
  }) => (
    <Animated.View
      entering={FadeInDown.delay(index * 50).duration(400)}
      style={styles.entryCard}
    >
      <View style={styles.entryHeader}>
        <Text style={styles.entryDate}>
          {format(new Date(item.date), "dd MMM")}
        </Text>
        <View
          style={[
            styles.shiftBadge,
            item.shift === "Morning"
              ? styles.morningBadge
              : styles.eveningBadge,
          ]}
        >
          <Text style={styles.shiftText}>{item.shift[0]}</Text>
        </View>
      </View>

      <View style={styles.userRow}>
        <Image
          source={{
            uri: item?.byUser?.profilePic ?? "https://ui-avatars.com/api/?name=" +
              encodeURIComponent(item?.byUser?.name ?? "User")
          }}
          style={styles.userAvatar}
        />
        <Text style={styles.userName} numberOfLines={1}>
          {item.byUser.name}
        </Text>
      </View>

      <Text style={styles.recordTime}>
        {format(new Date(item.createdAt), "hh:mm a")}
      </Text>

      <View style={styles.entryDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailValue}>{item.weight}L</Text>
          <Text style={styles.detailValue}>{item.fat || "N/A"}%</Text>
          <Text style={styles.detailValue}>{item.snf}%</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Weight</Text>
          <Text style={styles.detailLabel}>Fat</Text>
          <Text style={styles.detailLabel}>SNF</Text>
        </View>
      </View>

      <View style={styles.totalContainer}>
        <Text style={styles.rateText}>₹{item.rate}/L</Text>
        <Text style={styles.totalText}>₹{item.price}</Text>
      </View>
    </Animated.View>
  );

  // Enhanced summary with more metrics
  const renderSummary = () => (
    <Animated.View
      entering={FadeInDown.delay(100).duration(400)}
      style={styles.summaryWrapper}
    >
      <LinearGradient
        colors={["#0ea5e9", "#0284c7"]}
        style={styles.summaryContainer}
      >
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{summary.totalEntries}</Text>
          <Text style={styles.summaryLabel}>Entries</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>
            ₹{summary.totalAmount.toFixed(0)}
          </Text>
          <Text style={styles.summaryLabel}>Amount</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>
            {summary.totalQuantity.toFixed(1)}L
          </Text>
          <Text style={styles.summaryLabel}>Weight</Text>
        </View>
      </LinearGradient>

      {/* Additional metrics row */}
      {/* <View style={styles.additionalMetrics}>
        <Text style={styles.additionalMetricsText}>
          M: {summary.morningQuantity.toFixed(1)}L • E:{" "}
          {summary.eveningQuantity.toFixed(1)}L • Avg Fat:{" "}
          {summary.averageFat.toFixed(1)}% • Avg SNF:{" "}
          {summary.averageSNF.toFixed(1)}%
        </Text>
      </View> */}
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FarmerRecordsHeader />
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
              selectedDate ? format(new Date(selectedDate), "dd MMM") : "Date"
            }
            isActive={!!selectedDate}
            onPress={() => {
              setCalendarMode("single");
              setShowDateModal(true);
            }}
            icon="today"
          />
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
              setCalendarMode("range");
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
      {renderSummary()}

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
          renderItem={renderEntry}
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

      {/* Date Selection Modal with Calendar */}
      <Modal visible={showDateModal} transparent animationType="fade" statusBarTranslucent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.calendarModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Date</Text>
              <TouchableOpacity onPress={() => setShowDateModal(false)}>
                <MaterialIcons name="close" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Calendar
              onDayPress={handleDateSelect}
              markedDates={markedDates}
              theme={{
                todayTextColor: "#0ea5e9",
                arrowColor: "#0ea5e9",
                dotColor: "#0ea5e9",
                selectedDayBackgroundColor: "#0ea5e9",
              }}
            />

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowDateModal(false)}
            >
              <Text style={styles.modalButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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

      {/* Shift Selection Modal */}
      <Modal visible={showShiftModal} transparent animationType="fade" statusBarTranslucent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Shift</Text>
              <TouchableOpacity onPress={() => setShowShiftModal(false)}>
                <MaterialIcons name="close" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>
            {["", "Morning", "Evening"].map((shift) => (
              <TouchableOpacity
                key={shift}
                style={[
                  styles.optionItem,
                  selectedShift === shift && styles.selectedOption,
                ]}
                onPress={() => {
                  setSelectedShift(shift as any);
                  setShowShiftModal(false);
                }}
              >
                <Text style={styles.optionText}>{shift || "All Shifts"}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
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
