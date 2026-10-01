import PaymentForm from "@/components/admin/payment/paymentForm";
import FilterChip from "@/components/common/Chips";
import { PaymentHeader } from "@/components/common/HeaderVarients";
import UserModal from "@/components/common/UserModal";
import DairyLoadingScreen from "@/components/Loading";
import { api } from "@/constants/api";
import { User, WalletTransaction } from "@/constants/types";
import useCustomers from "@/hooks/useCustomer";
import { walletSourceLabel, walletStatusColor } from "@/utils/helper";
import { MaterialIcons } from "@expo/vector-icons";
import { format } from "date-fns";
import { useFocusEffect } from "expo-router";
import type React from "react";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const WALLET_PAGE_LIMIT = 20;

type PayableRole = "Farmer" | "Buyer" | "User";
const PAYABLE_ROLES: PayableRole[] = ["Farmer", "Buyer", "User"];

export default function PaymentRequestsScreen(): React.ReactElement {
  const { t } = useTranslation();
  const [roleFilter, setRoleFilter] = useState<PayableRole>("Farmer");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserSelector, setShowUserSelector] = useState(false);
  const [showAddEntryModal, setShowAddEntryModal] = useState(false);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const { customers, token } = useCustomers({ role: roleFilter, activeOnly: true });

  const roleLabel = (role: PayableRole): string => {
    switch (role) {
      case "Farmer":
        return t("entry.farmer");
      case "Buyer":
        return t("entry.buyer");
      default:
        return t("users.user");
    }
  };

  const handleRoleFilterChange = (role: PayableRole) => {
    if (role === roleFilter) return;
    setRoleFilter(role);
    setSelectedUser(null);
    setTransactions([]);
    setWalletBalance(0);
    setPage(1);
    setTotalCount(0);
  };

  const fetchWalletData = useCallback(async () => {
    if (!token || !selectedUser) return;
    setLoading(true);
    try {
      const [userResponse, statementResponse] = await Promise.all([
        fetch(`${api.getUser}?userId=${selectedUser._id}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }),
        fetch(
          `${api.walletStatement}?userId=${selectedUser._id}&limit=${WALLET_PAGE_LIMIT}&page=1`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        ),
      ]);

      const userData = await userResponse.json();
      if (userData.success) {
        setWalletBalance(userData.user?.walletAmount ?? 0);
      }

      const statementData = await statementResponse.json();
      if (statementData.success) {
        setTransactions(statementData.data);
        setTotalCount(statementData.totalCount ?? statementData.data.length);
        setPage(1);
      }
    } catch (error) {
      Alert.alert(t("common.error"), t("payments.failed_to_load_wallet"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, selectedUser]);

  useFocusEffect(
    useCallback(() => {
      if (selectedUser) {
        fetchWalletData();
      }
    }, [selectedUser])
  );

  const handleSelectUser = (user: User | null) => {
    setSelectedUser(user);
    setTransactions([]);
    setWalletBalance(0);
    setPage(1);
    setTotalCount(0);
  };

  const loadMoreTransactions = async () => {
    if (!token || !selectedUser || isLoadingMore) return;
    if (transactions.length >= totalCount) return;

    setIsLoadingMore(true);
    try {
      const nextPage = page + 1;
      const response = await fetch(
        `${api.walletStatement}?userId=${selectedUser._id}&limit=${WALLET_PAGE_LIMIT}&page=${nextPage}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
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
    if (!selectedUser) return;
    setRefreshing(true);
    fetchWalletData();
  }, [selectedUser, fetchWalletData]);

  const handleAddEntryPress = () => {
    if (!selectedUser) {
      Alert.alert(t("common.error"), t("payments.select_user_first"));
      return;
    }
    setShowAddEntryModal(true);
  };

  const renderTransaction = ({ item }: { item: WalletTransaction }) => {
    const isCredit = item.direction === "Credit";
    const amountColor = walletStatusColor(item.status, isCredit);
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
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
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{walletSourceLabel(item.source)}</Text>
            <Text style={styles.userId}>
              {format(new Date(item.createdAt), "dd MMM yyyy, hh:mm a")}
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
      <PaymentHeader addNewProduct={handleAddEntryPress} />
      <View style={styles.roleTabRow}>
        {PAYABLE_ROLES.map((role) => (
          <TouchableOpacity
            key={role}
            style={[styles.roleTab, roleFilter === role && styles.roleTabActive]}
            onPress={() => handleRoleFilterChange(role)}
          >
            <Text style={[styles.roleTabText, roleFilter === role && styles.roleTabTextActive]}>
              {roleLabel(role)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.tabContainer}>
        <FilterChip
          title={selectedUser ? selectedUser.name.split(" ")[0] ?? "User" : t("payments.select_user")}
          isActive={!!selectedUser}
          onPress={() => setShowUserSelector(true)}
          icon="person"
        />
        {selectedUser && (
          <View style={styles.balanceChip}>
            <MaterialIcons name="account-balance-wallet" size={16} color="#0ea5e9" />
            <Text style={styles.balanceChipText}>₹{walletBalance.toFixed(2)}</Text>
          </View>
        )}
      </View>

      {!selectedUser ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="person-search" size={48} color="#9ca3af" />
          <Text style={styles.emptyText}>{t("payments.select_user_prompt")}</Text>
        </View>
      ) : loading ? (
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
        title={roleLabel(roleFilter)}
        showUserSelector={showUserSelector}
        setShowUserSelector={setShowUserSelector}
        filteredUser={customers}
        selectedUser={selectedUser}
        setSelectedUser={handleSelectUser}
        updateFormData={() => {}}
      />

      <PaymentForm
        visible={showAddEntryModal}
        onClose={() => setShowAddEntryModal(false)}
        user={selectedUser}
        token={token}
        onSuccess={fetchWalletData}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  roleTabRow: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingTop: 12,
    backgroundColor: "#d9dee6ff",
    gap: 8,
  },
  roleTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
  },
  roleTabActive: {
    backgroundColor: "#0ea5e9",
    borderColor: "#0ea5e9",
  },
  roleTabText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
  },
  roleTabTextActive: {
    color: "#ffffff",
  },
  tabContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#d9dee6ff",
    gap: 8,
  },
  balanceChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e0f2fe",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
  },
  balanceChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0369a1",
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
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    color: "#9ca3af",
    textAlign: "center",
    paddingHorizontal: 32,
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
