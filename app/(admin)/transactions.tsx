import FilterChip from "@/components/common/Chips";
import { CustomHeader } from "@/components/common/CustomHeader";
import UserModal from "@/components/common/UserModal";
import DairyLoadingScreen from "@/components/Loading";
import { api } from "@/constants/api";
import { User, WalletTransaction } from "@/constants/types";
import useCustomers from "@/hooks/useCustomer";
import { walletSourceLabel, walletStatusColor } from "@/utils/helper";
import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import { format } from "date-fns";
import { useFocusEffect } from "expo-router";
import type React from "react";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const WALLET_PAGE_LIMIT = 20;

type SourceFilter = "All" | WalletTransaction["source"];
const SOURCE_FILTERS: SourceFilter[] = ["All", "MilkBuy", "MilkSell", "CashPayment", "Top-up", "ProductOrder"];

export default function TransactionsScreen(): React.ReactElement {
  const { t } = useTranslation();
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("All");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserSelector, setShowUserSelector] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [token, setToken] = useState<string>("");
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const { customers } = useCustomers({});

  const buildStatementUrl = (pageNum: number) => {
    const params = new URLSearchParams({
      limit: String(WALLET_PAGE_LIMIT),
      page: String(pageNum),
    });
    if (sourceFilter !== "All") params.append("source", sourceFilter);
    if (selectedUser) params.append("userId", selectedUser._id);
    if (selectedDate) {
      params.append("startDate", selectedDate);
      params.append("endDate", selectedDate);
    }
    return `${api.walletStatement}?${params.toString()}`;
  };

  const fetchTransactions = useCallback(async () => {
    const storedToken = await AsyncStorage.getItem("token");
    const parsedToken = storedToken ? JSON.parse(storedToken) : "";
    setToken(parsedToken);
    if (!parsedToken) return;

    setLoading(true);
    try {
      const response = await fetch(buildStatementUrl(1), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${parsedToken}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setTransactions(data.data);
        setTotalCount(data.totalCount ?? data.data.length);
        setPage(1);
      }
    } catch (error) {
      Alert.alert(t("common.error"), t("payments.failed_to_load_wallet"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [sourceFilter, selectedUser, selectedDate]);

  useFocusEffect(
    useCallback(() => {
      fetchTransactions();
    }, [fetchTransactions])
  );

  const loadMoreTransactions = async () => {
    if (!token || isLoadingMore) return;
    if (transactions.length >= totalCount) return;

    setIsLoadingMore(true);
    try {
      const nextPage = page + 1;
      const response = await fetch(buildStatementUrl(nextPage), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setTransactions((prev) => [...prev, ...data.data]);
        setTotalCount(data.totalCount ?? totalCount);
        setPage(nextPage);
      }
    } catch (error) {
      Alert.alert(t("common.error"), t("payments.failed_to_load_wallet"));
    } finally {
      setIsLoadingMore(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTransactions();
  }, [fetchTransactions]);

  const resetPagination = () => {
    setTransactions([]);
    setPage(1);
    setTotalCount(0);
  };

  const handleSourceFilterChange = (source: SourceFilter) => {
    if (source === sourceFilter) return;
    setSourceFilter(source);
    resetPagination();
  };

  const handleUserFilterChange = (user: User | null) => {
    setSelectedUser(user);
    resetPagination();
  };

  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(format(date, "yyyy-MM-dd"));
      resetPagination();
    }
  };

  const hasActiveFilters = sourceFilter !== "All" || !!selectedUser || !!selectedDate;

  const clearAllFilters = () => {
    setSourceFilter("All");
    setSelectedUser(null);
    setSelectedDate("");
    resetPagination();
  };

  const renderTransaction = ({ item }: { item: WalletTransaction }) => {
    const isCredit = item.direction === "Credit";
    const amountColor = walletStatusColor(item.status, isCredit);
    const user = typeof item.user === "object" ? item.user : null;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          {user?.profilePic ? (
            <Image source={{ uri: user.profilePic }} style={styles.userAvatar} />
          ) : (
            <View
              style={[
                styles.transactionIcon,
                { backgroundColor: `${amountColor}26` },
              ]}
            >
              <MaterialIcons
                name={
                  item.status === "Pending"
                    ? "schedule"
                    : item.status === "Failed"
                      ? "cancel"
                      : isCredit ? "trending-up" : "trending-down"
                }
                size={20}
                color={amountColor}
              />
            </View>
          )}
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name ?? t("payments.unknown_user")}</Text>
            <Text style={styles.userId}>
              {walletSourceLabel(item.source)} • {format(new Date(item.createdAt), "dd MMM yyyy, hh:mm a")}
            </Text>
            {item.status !== "Success" && (
              <Text style={styles.statusBadgeText}>{item.status}</Text>
            )}
          </View>
          <View style={styles.amountContainer}>
            <Text style={[styles.amount, { color: amountColor }]}>
              {isCredit ? "+" : "-"}₹{item.amount}
            </Text>
            {item.balanceAfter !== null && (
              <Text style={styles.balanceAfterText}>
                {t("payments.balance")}: ₹{item.balanceAfter.toFixed(2)}
              </Text>
            )}
          </View>
        </View>
        {!!item.note && (
          <View style={styles.noteRow}>
            <MaterialIcons name="notes" size={14} color="#9ca3af" />
            <Text style={styles.noteText}>{item.note}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <CustomHeader title={t("navigation.transactions")} />

      <View style={styles.filterRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {SOURCE_FILTERS.map((source) => (
            <TouchableOpacity
              key={source}
              style={[styles.filterTab, sourceFilter === source && styles.filterTabActive]}
              onPress={() => handleSourceFilterChange(source)}
            >
              <Text
                style={[
                  styles.filterTabText,
                  sourceFilter === source && styles.filterTabTextActive,
                ]}
              >
                {source === "All" ? t("common.all") : walletSourceLabel(source)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.chipFilterRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipFilterScroll}
        >
          <FilterChip
            title={selectedUser ? selectedUser.name.split(" ")[0] ?? "User" : t("payments.select_user")}
            isActive={!!selectedUser}
            onPress={() => setShowUserSelector(true)}
            icon="person"
          />
          <FilterChip
            title={selectedDate ? format(new Date(selectedDate), "dd MMM yyyy") : t("common.select_date")}
            isActive={!!selectedDate}
            onPress={() => setShowDatePicker(true)}
            icon="event"
          />
          {hasActiveFilters && (
            <TouchableOpacity style={styles.resetButton} onPress={clearAllFilters}>
              <MaterialIcons name="clear-all" size={16} color="#ef4444" />
              <Text style={styles.resetButtonText}>{t("common.reset")}</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>

      {loading ? (
        <DairyLoadingScreen loading loadingText={t("payments.loading_transactions")} />
      ) : (
        <FlatList
          data={transactions}
          renderItem={renderTransaction}
          keyExtractor={(item: WalletTransaction) => item._id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#007AFF"
              colors={["#007AFF"]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{t("common.no_results_found")}</Text>
            </View>
          }
          ListFooterComponent={
            transactions.length < totalCount ? (
              <TouchableOpacity
                style={styles.loadMoreButton}
                onPress={loadMoreTransactions}
                disabled={isLoadingMore}
              >
                {isLoadingMore ? (
                  <ActivityIndicator size="small" color="#0ea5e9" />
                ) : (
                  <Text style={styles.loadMoreText}>{t("payments.load_more")}</Text>
                )}
              </TouchableOpacity>
            ) : null
          }
        />
      )}

      <UserModal
        title={t("payments.select_user")}
        showUserSelector={showUserSelector}
        setShowUserSelector={setShowUserSelector}
        filteredUser={customers}
        selectedUser={selectedUser}
        setSelectedUser={handleUserFilterChange}
        updateFormData={() => {}}
      />

      {showDatePicker && (
        <DateTimePicker
          value={selectedDate ? new Date(selectedDate) : new Date()}
          mode="date"
          display="default"
          onChange={handleDateChange}
          maximumDate={new Date()}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  filterRow: {
    backgroundColor: "#d9dee6ff",
    paddingVertical: 12,
  },
  filterScroll: {
    paddingHorizontal: 12,
    gap: 8,
  },
  filterTab: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
  },
  filterTabActive: {
    backgroundColor: "#0ea5e9",
    borderColor: "#0ea5e9",
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
  },
  filterTabTextActive: {
    color: "#ffffff",
  },
  chipFilterRow: {
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingVertical: 10,
  },
  chipFilterScroll: {
    paddingHorizontal: 12,
    gap: 8,
    alignItems: "center",
  },
  resetButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
  },
  resetButtonText: {
    color: "#ef4444",
    fontSize: 12,
    fontWeight: "600",
  },
  listContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: "#1f2937",
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  transactionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 2,
  },
  userId: {
    fontSize: 12,
    color: "#9ca3af",
    marginBottom: 2,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#f59e0b",
  },
  amountContainer: {
    alignItems: "flex-end",
  },
  amount: {
    fontSize: 18,
    fontWeight: "bold",
  },
  balanceAfterText: {
    fontSize: 11,
    color: "#9ca3af",
    marginTop: 2,
  },
  noteRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#374151",
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    color: "#d1d5db",
    fontStyle: "italic",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: "#9ca3af",
  },
  loadMoreButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#0ea5e9",
  },
  loadMoreText: {
    color: "#0ea5e9",
    fontWeight: "600",
    fontSize: 14,
  },
});
