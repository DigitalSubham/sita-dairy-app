import { CustomHeader } from "@/components/common/CustomHeader";
import DairyLoadingScreen from "@/components/Loading";
import { api } from "@/constants/api";
import {
  MaterialCommunityIcons,
  MaterialIcons
} from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { format } from "date-fns";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Image,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";

interface User {
  id: number;
  _id: string;
  name: string;
  fatherName: string;
  role: string;
  walletAmount: number;
  totalWithdrawnAmount: number;
  isVerified: boolean;
  userVerificationOtpExpiry: string;
  createdAt: string;
  updatedAt: string;
  profilePic: string;
  mobile: string;
  address: string;
}

export default function CustomerDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchUserData = useCallback(async () => {
    const storedToken = await AsyncStorage.getItem("token");
    const token = storedToken ? JSON.parse(storedToken) : "";
    if (!token) {
      router.replace("/login");
      return;
    }
    try {
      setLoading(true);
      const response = await fetch(`${api.getUser}?userId=${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const responseData = await response.json();
      if (responseData.success) {
        setUserData(responseData.user);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      setUserData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchUserData();
  }, [fetchUserData]);

  const handleCall = () => {
    if (userData?.mobile) {
      const mobileNumber = userData.mobile.replaceAll(/\s+/g, "");
      Linking.openURL(`tel:${mobileNumber}`);
    }
  };

  const handleMessage = () => {
    if (userData?.mobile) {
      const mobileNumber = userData.mobile.replaceAll(/\s+/g, "");
      Linking.openURL(`sms:${mobileNumber}`);
    }
  };

  if (loading) {
    return (
      <DairyLoadingScreen loading loadingText="loading Customer..." />
    );
  }

  if (!userData) {
    return (
      <View style={styles.errorContainer}>
        <MaterialCommunityIcons
          name="alert-circle-outline"
          size={64}
          color="#ef4444"
        />
        <Text style={styles.errorText}>Failed to load customer data</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchUserData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "MMM dd, yyyy");
  };


  return (

    <View style={styles.safeArea}>
      <CustomHeader title="Customer Details" showBackButton showMenuButton={false} />
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#3b82f6"]}
            tintColor="#3b82f6"
          />
        }
      >
        {/* Profile Card */}
        <Animated.View
          entering={FadeInDown.delay(0)}
          style={styles.profileCardContainer}
        >
          <LinearGradient
            colors={["#3b82f6", "#1d4ed8"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.profileCardBackground}
          />
          <View style={styles.profileCardContent}>
            <View style={styles.profileImageContainer}>
              <Image
                source={{ uri: userData.profilePic }}
                style={styles.profilePic}
              />
              {userData.isVerified && (
                <View style={styles.verifiedBadge}>
                  <MaterialIcons name="verified" size={20} color="#16a34a" />
                </View>
              )}
            </View>

            <View style={styles.profileInfo}>
              <Text style={styles.name}>{userData.name}</Text>
              <Text style={styles.fatherName}>{userData.fatherName}</Text>
              <Text style={styles.mobile}>{userData.mobile}</Text>

              <View style={styles.badgeContainer}>
                <View style={styles.roleBadge}>
                  <MaterialCommunityIcons
                    name="cow"
                    size={14}
                    color="#ffffff"
                  />
                  <Text style={styles.roleText}>{userData.role}</Text>
                </View>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View
          entering={FadeInUp.delay(200)}
          style={styles.quickActions}
        >
          <TouchableOpacity style={styles.actionButton} onPress={handleCall}>
            <View style={[styles.actionIcon, { backgroundColor: "#16a34a" }]}>
              <MaterialIcons name="call" size={24} color="#ffffff" />
            </View>
            <Text style={styles.actionText}>Call</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleMessage}>
            <View style={[styles.actionIcon, { backgroundColor: "#3b82f6" }]}>
              <MaterialIcons name="message" size={24} color="#ffffff" />
            </View>
            <Text style={styles.actionText}>Message</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <View style={[styles.actionIcon, { backgroundColor: "#8b5cf6" }]}>
              <MaterialCommunityIcons name="cow" size={24} color="#ffffff" />
            </View>
            <Text style={styles.actionText}>Records</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <View style={[styles.actionIcon, { backgroundColor: "#f59e0b" }]}>
              <MaterialIcons name="payment" size={24} color="#ffffff" />
            </View>
            <Text style={styles.actionText}>Payment</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Wallet Cards */}
        <Animated.View
          entering={FadeInUp.delay(300)}
          style={styles.walletCardsRow}
        >
          <View style={styles.walletCardSmall}>
            <LinearGradient
              colors={["#8b5cf6", "#7c3aed"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.walletGradientSmall}
            >
              <MaterialCommunityIcons
                name="wallet-outline"
                size={24}
                color="#fff"
              />
              <Text style={styles.walletLabel}>Balance</Text>
              <Text style={styles.walletAmountSmall}>
                ₹{Math.floor(userData.walletAmount).toFixed(2)}
              </Text>
            </LinearGradient>
          </View>

          <View style={styles.walletCardSmall}>
            <LinearGradient
              colors={["#16a34a", "#15803d"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.walletGradientSmall}
            >
              <MaterialCommunityIcons
                name="cash-multiple"
                size={24}
                color="#fff"
              />
              <Text style={styles.walletLabel}>{userData.role === "Farmer" ? "Withdrawn" : "Paid"}</Text>
              <Text style={styles.walletAmountSmall}>
                ₹{userData.totalWithdrawnAmount}
              </Text>
            </LinearGradient>
          </View>
        </Animated.View>

        {/* Info Card */}
        <Animated.View entering={FadeInUp.delay(400)} style={styles.infoCard}>
          <Text style={styles.infoCardTitle}>Account Information</Text>

          <View style={styles.infoRow}>
            <View style={styles.infoLabelContainer}>
              <MaterialCommunityIcons
                name="identifier"
                size={20}
                color="#3b82f6"
              />
              <Text style={styles.infoLabel}>Customer ID</Text>
            </View>
            <Text style={styles.infoValue}>
              {userData.id}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoLabelContainer}>
              <MaterialCommunityIcons
                name="map-marker"
                size={20}
                color="#3b82f6"
              />
              <Text style={styles.infoLabel}>Address</Text>
            </View>
            <Text style={styles.infoValue}>{userData.address}</Text>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoLabelContainer}>
              <MaterialCommunityIcons
                name="calendar-month"
                size={20}
                color="#3b82f6"
              />
              <Text style={styles.infoLabel}>Joined</Text>
            </View>
            <Text style={styles.infoValue}>
              {formatDate(userData.createdAt)}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoLabelContainer}>
              <MaterialCommunityIcons name="update" size={20} color="#3b82f6" />
              <Text style={styles.infoLabel}>Last Updated</Text>
            </View>
            <Text style={styles.infoValue}>
              {formatDate(userData.updatedAt)}
            </Text>
          </View>
        </Animated.View>
        <View style={styles.overviewContainer}>
          {/* Quick Stats */}
          <Animated.View entering={FadeInUp.delay(200)} style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: "#dbeafe" }]}>
                <MaterialCommunityIcons name="cow" size={24} color="#3b82f6" />
              </View>
              <Text style={styles.statValue}>245L</Text>
              <Text style={styles.statLabel}>Total Milk</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: "#dcfce7" }]}>
                <MaterialIcons name="trending-up" size={24} color="#16a34a" />
              </View>
              <Text style={styles.statValue}>4.2%</Text>
              <Text style={styles.statLabel}>Avg Fat</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: "#fef3c7" }]}>
                <MaterialCommunityIcons
                  name="chart-line"
                  size={24}
                  color="#d97706"
                />
              </View>
              <Text style={styles.statValue}>8.5%</Text>
              <Text style={styles.statLabel}>Avg SNF</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: "#ede9fe" }]}>
                <MaterialIcons name="payments" size={24} color="#8b5cf6" />
              </View>
              <Text style={styles.statValue}>₹45</Text>
              <Text style={styles.statLabel}>Avg Rate</Text>
            </View>
          </Animated.View>

          {/* Recent Activity */}
          <Animated.View entering={FadeInUp.delay(400)} style={styles.activityCard}>
            <Text style={styles.activityTitle}>Recent Activity</Text>
            <View style={styles.activityItem}>
              <View style={[styles.activityIcon, { backgroundColor: "#dcfce7" }]}>
                <MaterialCommunityIcons name="cow" size={16} color="#16a34a" />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityText}>Morning milk collection</Text>
                <Text style={styles.activityTime}>18.5L • 2 hours ago</Text>
              </View>
            </View>

            <View style={styles.activityItem}>
              <View style={[styles.activityIcon, { backgroundColor: "#dbeafe" }]}>
                <MaterialIcons name="payment" size={16} color="#3b82f6" />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityText}>Payment received</Text>
                <Text style={styles.activityTime}>₹2,500 • Yesterday</Text>
              </View>
            </View>

            <View style={styles.activityItem}>
              <View style={[styles.activityIcon, { backgroundColor: "#fef3c7" }]}>
                <MaterialCommunityIcons
                  name="quality-high"
                  size={16}
                  color="#d97706"
                />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityText}>Quality test completed</Text>
                <Text style={styles.activityTime}>
                  Fat: 4.3% • SNF: 8.8% • 2 days ago
                </Text>
              </View>
            </View>
          </Animated.View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  loadingText: {
    color: "#6b7280",
    marginTop: 12,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f8fafc",
  },
  errorText: {
    fontSize: 18,
    color: "#6b7280",
    marginTop: 16,
    marginBottom: 24,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },

  // Profile Card
  profileCardContainer: {
    margin: 16,
    borderRadius: 24,
    overflow: "hidden",
    position: "relative",
    height: 200,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  profileCardBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  profileCardContent: {
    flex: 1,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
    zIndex: 1,
  },
  profileImageContainer: {
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  profilePic: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  verifiedBadge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 4,
  },
  profileInfo: {
    marginLeft: 20,
    flex: 1,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 4,
  },
  fatherName: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 4,
  },
  mobile: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 10,
  },
  badgeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  roleBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  roleText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 12,
  },

  // Quick Actions
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  actionButton: {
    alignItems: "center",
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6b7280",
  },

  // Wallet Cards
  walletCardsRow: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  walletCardSmall: {
    flex: 1,
    borderRadius: 20,
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  walletGradientSmall: {
    padding: 16,
    height: 120,
    justifyContent: "space-between",
  },
  walletLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 8,
  },
  walletAmountSmall: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#ffffff",
  },

  // Info Card
  infoCard: {
    margin: 16,
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  infoCardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  infoLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoLabel: {
    fontSize: 15,
    color: "#6b7280",
    fontWeight: "500",
    marginLeft: 8,
  },
  infoValue: {
    fontSize: 15,
    color: "#1f2937",
    fontWeight: "500",
    flex: 1,
    textAlign: "right",
  },

  // Tab Navigation
  tabContainer: {
    flexDirection: "row",
    marginHorizontal: 16,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 4,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 12,
    minWidth: 40,
  },
  activeTabButton: {
    backgroundColor: "#eff6ff",
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6b7280",
    marginLeft: 4,
    flex: 1,
    textAlign: "center",
  },
  activeTabButtonText: {
    color: "#3b82f6",
  },
  tabBadge: {
    backgroundColor: "#3b82f6",
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 4,
    paddingHorizontal: 2,
  },
  tabBadgeText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "bold",
  },

  // Section
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },

  // Overview
  overviewContainer: {
    gap: 16,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  statCard: {
    width: "48%",
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#6b7280",
  },

  // Activity
  activityCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activityTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 16,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1f2937",
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    color: "#6b7280",
  },

  // Coupons
  couponsList: {
    gap: 16,
  },
  couponItem: {
    borderRadius: 16,
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  couponGradient: {
    padding: 20,
  },
  couponHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  couponBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  couponBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  copyButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  copyButtonActive: {
    backgroundColor: "#16a34a",
  },
  couponBody: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  couponAmountContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  couponAmountPrefix: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 4,
  },
  couponAmount: {
    fontSize: 36,
    fontWeight: "bold",
  },
  couponCodeContainer: {
    alignItems: "flex-end",
  },
  couponCodeLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  couponCode: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 1,
  },
  couponDivider: {
    height: 1,
    marginBottom: 16,
  },
  couponFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  couponDateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  couponDateLabel: {
    fontSize: 12,
    marginLeft: 4,
  },
  couponDate: {
    fontSize: 14,
  },

  // Payments
  paymentsList: {
    gap: 16,
  },
  paymentItem: {
    borderRadius: 16,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  paymentCard: {
    backgroundColor: "#ffffff",
    padding: 20,
  },
  paymentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  paymentIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  paymentDetailsContainer: {
    flex: 1,
    marginLeft: 12,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
  },
  paymentDate: {
    fontSize: 12,
    color: "#6b7280",
  },
  paymentAmountContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  paymentAmountPrefix: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#16a34a",
    marginTop: 2,
  },
  paymentAmount: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#16a34a",
  },
  paymentDivider: {
    height: 1,
    backgroundColor: "#f3f4f6",
    marginBottom: 16,
  },
  paymentBody: {
    gap: 12,
  },
  paymentInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  paymentInfoItem: {
    flex: 1,
  },
  paymentInfoLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 4,
  },
  paymentInfoValue: {
    fontSize: 14,
    color: "#1f2937",
    fontWeight: "500",
  },
  paymentStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  paymentStatusText: {
    fontSize: 12,
    fontWeight: "600",
  },

  // Empty State
  emptyStateContainer: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#6b7280",
    marginTop: 12,
  },
});
