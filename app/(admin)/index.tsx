import TransactionItem from "@/components/admin/dashboard/EntryCard";
import { BorderedDashboardCard } from "@/components/admin/DashboardCard";
import { DashboardHeader } from "@/components/common/HeaderVarients";
import Icon from "@/components/common/Icon";
import LanguageChange from "@/components/common/LanguageChange";
import DairyLoadingScreen from "@/components/Loading";
import { api } from "@/constants/api";
import { AdminDashboardData } from "@/constants/types";
import { fetchData } from "@/utils/services";
import { useFocusEffect, useNavigation, useRouter } from "expo-router";
import React, { ReactNode, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  GestureResponderEvent,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";

interface QuickActionButtonProps {
  title: string;
  icon: ReactNode;
  color: string;
  onPress?: (event: GestureResponderEvent) => void;
  delay?: number;
}

const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState<AdminDashboardData | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [languageModal, setLanguageModal] = useState<boolean>(false)
  const router = useRouter();
  const { t } = useTranslation()
  const navigation = useNavigation()


  const fetchDashboardData = async () => {
    await fetchData({
      apiUrl: api.dashboard,
      setLoading,
      setRefreshing,
      setData: setDashboardData,
      extractData: (res) => (res.success && res.data ? res.data : []),
      navigation
    });
  };

  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboardData()
  }, []);

  const QuickActionButton: React.FC<QuickActionButtonProps> = ({
    title,
    icon,
    color,
    onPress,
    delay = 0,
  }) => (
    <Animated.View
      entering={FadeInUp.delay(delay).duration(600)}
      style={styles.quickActionContainer}
    >
      <TouchableOpacity
        style={[styles.quickActionButton]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <View style={[styles.quickActionIcon]}>
          {icon}
        </View>
        <Text style={styles.quickActionText}>{title}</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  if (loading) {
    return (
      <DairyLoadingScreen
        loading={loading}
        loadingText="Syncing your farm data..."
      />
    );
  }

  return (
    <View style={styles.container}>
      <DashboardHeader title={t("dashboard.admin_dashboard")} subtitle={t("dashboard.admin_dashboard_tagline")} setLanguageModal={setLanguageModal} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#1976D2"]}
            tintColor="#1976D2"
          />
        }
      >
        {/* Dashboard Cards */}
        <View style={styles.cardsSection}>
          <BorderedDashboardCard
            title={t("dashboard.total_users")}
            value={dashboardData?.totalCustomers || 0}
            icon={Icon("users")(50, "#FFFFFF")}
            color="#1976D2"
            delay={100}
            onPress={() => router.push("/(admin)/customers")}
          />
          <BorderedDashboardCard
            title={t("dashboard.today_collection")}
            value={`${dashboardData?.totalTodaysMilk || 0} L`}
            icon={Icon("collection")(50, "#FFFFFF")}
            color="#2E7D32"
            delay={200}
            onPress={() => router.push("/(admin)/record")}
          />
          <BorderedDashboardCard
            title={t("dashboard.monthly_collection")}
            value={`${dashboardData?.totalMonthlyMilk || 0} L`}
            icon={Icon("collection")(50, "#FFFFFF")}
            color="#7B1FA2"
            delay={300}
            onPress={() => router.push("/(admin)/record")}
          />
        </View>

        {/* Quick Actions */}
        <Animated.View entering={FadeInUp.delay(600)} style={styles.section}>
          <Text style={styles.sectionTitle}>{t("dashboard.quick_actions")}</Text>
          <View style={styles.quickActionsGrid}>
            <QuickActionButton
              title={t("dashboard.all_users")}
              icon={Icon("users")(40, "#FFFFFF")}
              color="#1976D2"
              delay={0}
              onPress={() => router.push("/(admin)/customers")}
            />
            <QuickActionButton
              title={t("dashboard.milk_entry")}
              icon={Icon("entry")(40, "#FFFFFF")}
              color="#2E7D32"
              delay={100}
              onPress={() => router.push("/(admin)/milkEntry")}
            />
            <QuickActionButton
              title={t("navigation.payments")}
              icon={Icon("wallet")(40, "#FFFFFF")}
              color="#F57C00"
              delay={200}
              onPress={() => router.push("/(admin)/payments")}
            />
            <QuickActionButton
              title={t("dashboard.reports")}
              icon={Icon("ledger")(40, "#FFFFFF")}
              color="#7B1FA2"
              delay={300}
              onPress={() => router.push("/(admin)/record")}
            />
          </View>
        </Animated.View>

        {/* Inventory Summary */}
        {/* <Animated.View entering={FadeInUp.delay(700)} style={styles.section}>
          <Text style={styles.sectionTitle}>Inventory Summary</Text>
          <View style={styles.inventoryCard}>
            <View style={styles.inventoryHeader}>
              <MaterialCommunityIcons
                name="warehouse"
                size={24}
                color="#1976D2"
              />
              <Text style={styles.inventoryHeaderText}>Milk Inventory</Text>
            </View>
            <View style={styles.inventoryContent}>
              {dashboardData?.milkInventory?.map((item, index) => (
                <View key={index} style={styles.inventoryRow}>
                  <Text style={styles.inventoryDate}>{item.date}</Text>
                  <View style={styles.inventoryDetails}>
                    <View style={styles.inventoryItem}>
                      <MaterialCommunityIcons
                        name="weather-sunny"
                        size={16}
                        color="#F57C00"
                      />
                      <Text style={styles.inventoryItemText}>
                        {item.morningCollection}L
                      </Text>
                    </View>
                    <View style={styles.inventoryItem}>
                      <MaterialCommunityIcons
                        name="weather-night"
                        size={16}
                        color="#7B1FA2"
                      />
                      <Text style={styles.inventoryItemText}>
                        {item.eveningCollection}L
                      </Text>
                    </View>
                    <View style={styles.inventoryItem}>
                      <MaterialIcons
                        name="shopping-cart"
                        size={16}
                        color="#2E7D32"
                      />
                      <Text style={styles.inventoryItemText}>
                        {item.totalSold}L
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
              <View style={styles.inventoryFooter}>
                <View style={styles.inventoryFooterItem}>
                  <Text style={styles.inventoryFooterLabel}>
                    Total Collected
                  </Text>
                  <Text style={styles.inventoryFooterValue}>
                    {dashboardData?.totalMilkCollected}L
                  </Text>
                </View>
                <View style={styles.inventoryFooterItem}>
                  <Text style={styles.inventoryFooterLabel}>Total Sold</Text>
                  <Text style={styles.inventoryFooterValue}>
                    {dashboardData?.totalMilkSold}L
                  </Text>
                </View>
                <View style={styles.inventoryFooterItem}>
                  <Text style={styles.inventoryFooterLabel}>Wastage</Text>
                  <Text
                    style={[styles.inventoryFooterValue, { color: "#F44336" }]}
                  >
                    {dashboardData?.milkWastage}L
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </Animated.View> */}

        {/* Recent Transactions */}
        <Animated.View entering={FadeInUp.delay(900)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t("dashboard.recent_entries")}</Text>
            <TouchableOpacity onPress={() => router.push("/(admin)/record")}>
              <Text style={styles.viewAllText}>{t("common.view_all")}</Text>
            </TouchableOpacity>
          </View>
          <View>
            {dashboardData?.lastFiveEntries?.map((transaction) => (
              <TransactionItem key={transaction._id} data={transaction} />
            ))}
          </View>
        </Animated.View>
      </ScrollView>
      <LanguageChange languageModal={languageModal} setLanguageModal={setLanguageModal} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F7FA",
  },
  loadingContent: {
    alignItems: "center",
  },
  loader: {
    marginVertical: 16,
  },
  loadingText: {
    fontSize: 16,
    color: "#1976D2",
    fontWeight: "500",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  welcomeSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1976D2",
    marginBottom: 4,
  },
  welcomeSubtext: {
    fontSize: 16,
    color: "#5C6BC0",
  },
  cardsSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
    marginBottom: 24,
  },
  dashboardCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
    overflow: "hidden",
  },
  cardContent: {
    padding: 20,
    position: "relative",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  cardInfo: {
    flex: 1,
  },
  cardValue: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#263238",
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#455A64",
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 13,
    color: "#78909C",
  },
  cardAccent: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#263238",
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1976D2",
  },
  chartCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  quickActionContainer: {
    width: "48%",
    marginBottom: 16,
  },
  quickActionButton: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#263238",
  },
  inventoryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
    overflow: "hidden",
  },
  inventoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#F5F7FA",
    borderBottomWidth: 1,
    borderBottomColor: "#E1E8ED",
  },
  inventoryHeaderText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#263238",
    marginLeft: 8,
  },
  inventoryContent: {
    padding: 16,
  },
  inventoryRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  inventoryDate: {
    width: 80,
    fontSize: 14,
    fontWeight: "600",
    color: "#455A64",
  },
  inventoryDetails: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  inventoryItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  inventoryItemText: {
    fontSize: 14,
    color: "#455A64",
    marginLeft: 4,
  },
  inventoryFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E1E8ED",
  },
  inventoryFooterItem: {
    alignItems: "center",
  },
  inventoryFooterLabel: {
    fontSize: 12,
    color: "#78909C",
    marginBottom: 4,
  },
  inventoryFooterValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#263238",
  },
  farmersCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  farmerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  farmerprofilePic: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  farmerInfo: {
    flex: 1,
  },
  farmerName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#263238",
    marginBottom: 4,
  },
  farmerStats: {
    flexDirection: "row",
    alignItems: "center",
  },
  farmerStat: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  farmerStatText: {
    fontSize: 14,
    color: "#455A64",
    marginLeft: 4,
  },
  farmerActionButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: "#E3F2FD",
    borderRadius: 20,
  },
  farmerActionText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1976D2",
  },
  transactionsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  transactionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  transactionprofilePic: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#263238",
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: "#78909C",
  },
  transactionDetails: {
    alignItems: "flex-end",
  },
  transactionTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  transactionTypeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: "700",
  },
  pendingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: "rgba(245, 124, 0, 0.1)",
    borderRadius: 12,
    marginTop: 4,
  },
  pendingText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#F57C00",
  },
  statusCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  statusItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  statusText: {
    fontSize: 14,
    color: "#455A64",
  },
});

export default AdminDashboard;
