import { FarmerDashboardHeader } from "@/components/common/HeaderVarients";
import Icon from "@/components/common/Icon";
import Summary from "@/components/customer/Summary";
import DairyLoadingScreen from "@/components/Loading";
import { api } from "@/constants/api";
import { FarmerDashboardData } from "@/constants/types";
import { RootState } from "@/store/store";
import {
  AntDesign,
  MaterialCommunityIcons
} from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { format, parseISO } from "date-fns";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Linking,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import Animated, {
  FadeInDown,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";


export default function SellerDashboard() {
  const router = useRouter();
  const scrollY = useSharedValue(0);
  const supportButtonScale = useSharedValue(1);
  const [token, setToken] = useState<string>("");
  const [data, setData] = useState<FarmerDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const user = useSelector((store: RootState) => store.user);

  useEffect(() => {
    const fetchToken = async () => {
      const storedToken = await AsyncStorage.getItem("token");
      setToken(storedToken ? JSON.parse(storedToken) : "");
    };
    fetchToken();
  }, []);

  const fetchData = useCallback(async () => {
    try {
      // This would be your actual API endpoint
      const response = await fetch(api.dashboard, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Network response was not ok");
      const data = await response.json();

      if (data.success) {
        setData(data.data);
      } else {
        Alert.alert("Error", data.message);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      setLoading(true);
      fetchData();
    }
  }, [token, fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    if (token) {
      fetchData();
    } else {
      setRefreshing(false);
    }
  }, [token, fetchData]);

  const mainScrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const handleSupportPress = () => {
    supportButtonScale.value = withSequence(
      withSpring(0.9),
      withSpring(1.1),
      withSpring(1)
    );
    Linking.openURL(
      "https://wa.me/918892293899?text=Hello,%20I%20need%20support%20with%20the%20dairy%20management%20app."
    );
  };

  const supportButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: supportButtonScale.value }],
  }));

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), "dd MMM yyyy");
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid date";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Morning":
        return "#f59e0b";
      case "Evening":
        return "#3b82f6";
      default:
        return "#6b7280";
    }
  };

  if (loading) {
    return (
      <DairyLoadingScreen
        loading={loading}
        loadingText="Syncing your farm data..."
      />
    );
  }

  return (
    <SafeAreaView style={[styles.container]}>
      <FarmerDashboardHeader name={user?.name?.split(" ")[0] || "Farmer"} profilePic={user.profilePic ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(
          user.name || "Dairy Farmer"
        )}&background=3b82f6&color=fff`} />
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollViewContent}
        onScroll={mainScrollHandler}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#3b82f6"
            colors={["#3b82f6", "#2563eb"]}
            progressBackgroundColor="#f8fafc"
          />
        }
      >


        {/* Summary Cards */}
        {data && <Summary data={data} />}

        {/* Quality Metrics Card */}
        <Animated.View
          entering={FadeInDown.delay(400).duration(600)}
          style={styles.qualityCardContainer}
        >
          <LinearGradient
            colors={["#3b82f6", "#2563eb"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.qualityCard}
          >
            <View style={styles.qualityHeader}>
              <Text style={styles.qualityTitle}>Milk Quality Metrics</Text>
            </View>

            <View style={styles.qualityMetrics}>
              <View style={styles.qualityMetric}>
                <Text style={styles.qualityMetricValue}>
                  {data?.todaysFatValues}%
                </Text>
                <Text style={styles.qualityMetricLabel}>Fat</Text>
              </View>

              <View style={styles.qualityDivider} />

              <View style={styles.qualityMetric}>
                <Text style={styles.qualityMetricValue}>
                  {data?.todaysSnfValues}%
                </Text>
                <Text style={styles.qualityMetricLabel}>SNF</Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Recent Collections */}
        <Animated.View
          entering={FadeInDown.delay(500).duration(600)}
          style={styles.recentCollectionsSection}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Entry</Text>
            <TouchableOpacity onPress={() => router.push("/records")}>
              <Text style={styles.seeAllButton}>See All</Text>
            </TouchableOpacity>
          </View>

          {data?.lastFiveEntries && data.lastFiveEntries.length > 0 ? (
            data.lastFiveEntries.map((collection) => (
              <View key={collection._id} style={styles.collectionItem}>
                <View style={styles.collectionIconContainer}>
                  <MaterialCommunityIcons
                    name="cup-water"
                    size={24}
                    color="#3b82f6"
                  />
                </View>
                <View style={styles.collectionInfo}>
                  <Text style={styles.collectionDate}>
                    {formatDate(collection.date)}
                  </Text>
                  <Text style={styles.collectionDetails}>
                    {collection.weight} L • Fat: {collection.fat}% • SNF:{" "}
                    {collection.snf}% • Rate: {collection.rate}
                  </Text>
                </View>
                <View style={styles.collectionprice}>
                  <Text style={styles.collectionpriceValue}>
                    ₹{collection.price}
                  </Text>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: `${getStatusColor(
                          collection.shift
                        )}20`,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        // { color: getStatusColor(collection.status) },
                      ]}
                    >
                      {collection.shift.charAt(0).toUpperCase() +
                        collection.shift.slice(1)}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateText}>No recent collections</Text>
            </View>
          )}
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View
          entering={FadeInDown.delay(700).duration(600)}
          style={styles.quickActionsSection}
        >
          <Text style={styles.sectionTitle}>Quick Actions</Text>

          <View style={styles.quickActionsGrid}>
            <TouchableOpacity
              style={styles.quickActionItem}
              onPress={() => router.push("/products")}
            >
              <View
                style={[
                  styles.quickActionIcon,

                ]}
              >
                {Icon("products")(40, "#3b82f6")}
              </View>
              <Text style={styles.quickActionText}>Products</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionItem}
              onPress={() => router.push("/viewRates")}
            >
              <View
                style={[
                  styles.quickActionIcon,

                ]}
              >
                {Icon("up-arrow")(40, "#3b82f6")}
              </View>
              <Text style={styles.quickActionText}>View Rates</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionItem}
              onPress={() => router.push("/payment")}
            >
              <View
                style={[
                  styles.quickActionIcon,

                ]}
              >
                {Icon("wallet")(40, "#3b82f6")}
              </View>
              <Text style={styles.quickActionText}>Payment</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionItem}
              onPress={() => router.push("/records")}
            >
              <View
                style={[
                  styles.quickActionIcon,

                ]}
              >
                {Icon("ledger")(40, "#3b82f6")}
              </View>
              <Text style={styles.quickActionText}>Records</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Bottom Spacing */}
        <View style={{ height: 100 }} />
      </Animated.ScrollView>

      {/* Support Button */}
      <TouchableOpacity
        onPress={handleSupportPress}
        style={styles.floatingSupport}
      >
        <LinearGradient
          colors={["#10B981", "#059669"]}
          style={styles.floatingSupportGradient}
        >
          <Animated.View
            style={[styles.floatingSupportInner, supportButtonStyle]}
          >
            <AntDesign
              name="message"
              size={24}
              color="#fff"
              strokeWidth={2.5}
            />
          </Animated.View>
        </LinearGradient>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc", // Light background
  },
  scrollViewContent: {
    paddingTop: 20,
  },
  loaderContainer: {
    flex: 1,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    alignItems: "center",
  },
  loaderGradient: {
    width: 200,
    height: 200,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  loaderText: {
    color: "#fff",
    marginTop: 20,
    fontSize: 16,
    fontWeight: "600",
  },
  emptyStateContainer: {
    padding: 20,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    height: 100,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyStateText: {
    color: "#64748b",
    fontSize: 16,
  },
  userHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  userInfo: {
    flex: 1,
  },
  greeting: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1e293b", // Dark text for light theme
  },
  subGreeting: {
    fontSize: 16,
    color: "#64748b", // Muted text
    marginTop: 4,
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: "#3b82f6",
  },
  qualityCardContainer: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 20,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  qualityCard: {
    padding: 20,
  },
  qualityHeader: {
    marginBottom: 16,
  },
  qualityTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
  },
  qualitySubtitle: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
  },
  qualityMetrics: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  qualityMetric: {
    alignItems: "center",
  },
  qualityMetricValue: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "700",
  },
  qualityMetricLabel: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
  },
  qualityDivider: {
    width: 1,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  qualityButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  qualityButtonText: {
    color: "#ffffff",
    fontWeight: "600",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b", // Dark text
    marginBottom: 16,
  },
  seeAllButton: {
    color: "#3b82f6",
    fontSize: 14,
    fontWeight: "600",
  },
  recentCollectionsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  collectionItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  collectionIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  collectionInfo: {
    flex: 1,
  },
  collectionDate: {
    color: "#1e293b",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  collectionDetails: {
    color: "#64748b",
    fontSize: 14,
  },
  collectionprice: {
    alignItems: "flex-end",
  },
  collectionpriceValue: {
    color: "#1e293b",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },

  quickActionsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  quickActionItem: {
    width: "48%",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  quickActionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  quickActionText: {
    color: "#1e293b",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  floatingSupport: {
    position: "absolute",
    bottom: 30,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#10B981",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  floatingSupportGradient: {
    width: "100%",
    height: "100%",
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  floatingSupportInner: {
    width: "100%",
    height: "100%",
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
});
