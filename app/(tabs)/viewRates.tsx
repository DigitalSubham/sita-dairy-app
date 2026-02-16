import { FarmerRateChartHeader } from "@/components/common/HeaderVarients";
import { api } from "@/constants/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";


interface RateChartRow {
  fat: number;
  snf8_0: number;
  snf8_1: number;
  snf8_2: number;
  snf8_3: number;
  snf8_4: number;
  snf8_5: number;
}

export default function MilkEntry() {
  const [rateChart, setRateChart] = useState<RateChartRow[]>();

  const fetchDataFromServer = async () => {
    const token = await AsyncStorage.getItem("token");
    const parsedToken = token ? JSON.parse(token) : null;
    try {
      // setLoading(true)

      // Replace with your actual API endpoint
      const response = await fetch(api.rateChart, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${parsedToken}`
        },
      })

      const data = await response.json()

      if (data.success) {
        setRateChart(data.row)
      } else {
        Alert.alert("Error", data.message || "Failed to fetch data")
      }

    } catch (error) {
      Alert.alert("Error", "Failed to fetch data from server")
      console.error("Fetch error:", error)
    } finally {
      // setLoading(false)
    }
  }

  useEffect(() => {
    fetchDataFromServer()
  }, [])

  const renderEditableCell = (value: number) => {
    return (
      <View style={styles.cellTouchable}>
        <Text style={styles.cellText}>{value.toFixed(2)}</Text>
      </View>
    );
  };

  const renderRateChart = () => (
    <View style={styles.chartContainer}>
      <View style={styles.chartHeader}>
        <Text style={styles.chartTitle}>Fat & SNF Rate Chart</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.chartTable}>
          {/* Header Row */}
          <View style={styles.chartHeaderRow}>
            <Text style={styles.chartHeaderCell}>Fat %</Text>
            <Text style={styles.chartHeaderCell}>8.0</Text>
            <Text style={styles.chartHeaderCell}>8.1</Text>
            <Text style={styles.chartHeaderCell}>8.2</Text>
            <Text style={styles.chartHeaderCell}>8.3</Text>
            <Text style={styles.chartHeaderCell}>8.4</Text>
            <Text style={styles.chartHeaderCell}>8.5</Text>
          </View>

          {/* Data Rows */}
          <ScrollView style={styles.chartScrollView}>
            {rateChart?.map((row, index) => (
              <View key={index} style={styles.chartRow}>
                {renderEditableCell(row.fat)}
                {renderEditableCell(row.snf8_0)}
                {renderEditableCell(row.snf8_1)}
                {renderEditableCell(row.snf8_2)}
                {renderEditableCell(row.snf8_3)}
                {renderEditableCell(row.snf8_4)}
                {renderEditableCell(row.snf8_5)}
              </View>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Content */}<FarmerRateChartHeader />
      {renderRateChart()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    paddingTop: 10,
    paddingBottom: 10,
    paddingHorizontal: 20,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: "white",
  },
  tabText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "600",
  },
  activeTabText: {
    color: "#0ea5e9",
  },
  formContainer: {
    flex: 1,
    padding: 20,
  },

  rateContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ecfdf5",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#86efac",
  },
  rateLabel: {
    fontSize: 16,
    color: "#059669",
    marginLeft: 10,
    flex: 1,
  },
  rateValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#047857",
  },

  totalValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#047857",
  },
  submitButton: {
    borderRadius: 12,
    overflow: "hidden",
  },
  submitGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
  },
  submitButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  chartContainer: {
    flex: 1,
    padding: 20,
  },
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0c4a6e",
  },
  addRowButton: {
    backgroundColor: "#10b981",
    padding: 10,
    borderRadius: 8,
  },
  chartTable: {
    backgroundColor: "white",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  chartHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#0ea5e9",
    paddingVertical: 12,
  },
  chartHeaderCell: {
    width: 80,
    textAlign: "center",
    color: "white",
    fontWeight: "bold",
    fontSize: 12,
  },
  chartScrollView: {
    maxHeight: 400,
  },
  chartRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  cellTouchable: {
    width: 80,
    paddingVertical: 12,
    paddingHorizontal: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  cellText: {
    fontSize: 12,
    color: "#334155",
    textAlign: "center",
  },
  cellInput: {
    width: 80,
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontSize: 12,
    color: "#334155",
    textAlign: "center",
    backgroundColor: "#f0f9ff",
    borderWidth: 1,
    borderColor: "#0ea5e9",
  },
});
