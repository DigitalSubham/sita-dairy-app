import { FontAwesome, MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

interface DashboardData {
  totalTodaysEarnings: number;
  monthlyEarning: number;
  totalTodaysMilk: number;
  totalMonthlyMilk: number;
  todaysFatValues: number;
  todaysSnfValues: number;
}

interface SummaryProps {
  data: DashboardData;
}

const Summary: React.FC<SummaryProps> = ({ data }) => {
  return (
    <Animated.View
      entering={FadeInDown.delay(300).duration(600)}
      style={styles.summaryCardsContainer}
    >
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryIconContainer}>
            <MaterialCommunityIcons
              name="cup-water"
              size={20}
              color="#10b981"
            />
          </View>
          <View>
            <Text style={styles.summaryLabel}>Today's Collection</Text>
            <Text style={styles.summaryValue}>{data?.totalTodaysMilk} L</Text>
          </View>
        </View>

        <View style={styles.summaryCard}>
          <View
            style={[
              styles.summaryIconContainer,
              { backgroundColor: "rgba(245, 158, 11, 0.1)" },
            ]}
          >
            <FontAwesome name="money" size={20} color="#3b82f6" />
          </View>
          <View>
            <Text style={styles.summaryLabel}>Today Earning</Text>
            <Text style={styles.summaryValue}>
              ₹ {data?.totalTodaysEarnings}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <View
            style={[
              styles.summaryIconContainer,
              { backgroundColor: "rgba(16, 185, 129, 0.1)" },
            ]}
          >
            <MaterialCommunityIcons
              name="cup-water"
              size={20}
              color="#10b981"
            />
          </View>
          <View>
            <Text style={styles.summaryLabel}>Monthly Collection</Text>
            <Text style={styles.summaryValue}>{data?.totalMonthlyMilk} L</Text>
          </View>
        </View>

        <View style={styles.summaryCard}>
          <View
            style={[
              styles.summaryIconContainer,
              { backgroundColor: "rgba(139, 92, 246, 0.1)" },
            ]}
          >
            <FontAwesome name="money" size={20} color="#3b82f6" />
          </View>
          <View>
            <Text style={styles.summaryLabel}>Monthly Earning</Text>
            <Text style={styles.summaryValue}>₹ {data?.monthlyEarning}</Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  summaryCardsContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  summaryCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    width: "48%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    flexDirection: "row",
    alignItems: "center",
  },
  summaryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  summaryLabel: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e293b",
  },
});

export default Summary;
