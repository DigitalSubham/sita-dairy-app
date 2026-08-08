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

export default function ViewRates() {
  const [rateChart, setRateChart] = useState<RateChartRow[]>();

  const fetchDataFromServer = async () => {
    const token = await AsyncStorage.getItem("token");
    const parsedToken = token ? JSON.parse(token) : null;
    try {
      const response = await fetch(api.rateChart, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${parsedToken}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setRateChart(data.row);
      } else {
        Alert.alert("Error", data.message || "Failed to fetch data");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to fetch data from server");
      console.error("Fetch error:", error);
    }
  };

  useEffect(() => {
    fetchDataFromServer();
  }, []);

  const renderCell = (value: number) => {
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
              <View key={index + "i"} style={styles.chartRow}>
                {renderCell(row.fat)}
                {renderCell(row.snf8_0)}
                {renderCell(row.snf8_1)}
                {renderCell(row.snf8_2)}
                {renderCell(row.snf8_3)}
                {renderCell(row.snf8_4)}
                {renderCell(row.snf8_5)}
              </View>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FarmerRateChartHeader />
      {renderRateChart()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
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
});
