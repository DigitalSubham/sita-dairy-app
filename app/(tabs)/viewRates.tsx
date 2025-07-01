import { FarmerRateChartHeader } from "@/components/common/HeaderVarients";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

// Default rate chart data based on the images
const defaultRateChart = [
  {
    fat: 3.0,
    snf8_0: 32.0,
    snf8_1: 32.26,
    snf8_2: 32.51,
    snf8_3: 32.77,
    snf8_4: 33.02,
    snf8_5: 33.28,
  },
  {
    fat: 3.1,
    snf8_0: 32.38,
    snf8_1: 32.64,
    snf8_2: 32.9,
    snf8_3: 33.15,
    snf8_4: 33.41,
    snf8_5: 33.66,
  },
  {
    fat: 3.2,
    snf8_0: 32.77,
    snf8_1: 33.02,
    snf8_2: 33.28,
    snf8_3: 33.54,
    snf8_4: 33.79,
    snf8_5: 34.05,
  },
  {
    fat: 3.3,
    snf8_0: 33.15,
    snf8_1: 33.41,
    snf8_2: 33.66,
    snf8_3: 33.92,
    snf8_4: 34.18,
    snf8_5: 34.43,
  },
  {
    fat: 3.4,
    snf8_0: 33.54,
    snf8_1: 33.79,
    snf8_2: 34.05,
    snf8_3: 34.3,
    snf8_4: 34.56,
    snf8_5: 34.82,
  },
  {
    fat: 3.5,
    snf8_0: 33.92,
    snf8_1: 34.18,
    snf8_2: 34.43,
    snf8_3: 34.69,
    snf8_4: 34.94,
    snf8_5: 35.2,
  },
  {
    fat: 3.6,
    snf8_0: 34.3,
    snf8_1: 34.56,
    snf8_2: 34.82,
    snf8_3: 35.07,
    snf8_4: 35.33,
    snf8_5: 35.58,
  },
  {
    fat: 3.7,
    snf8_0: 34.69,
    snf8_1: 34.94,
    snf8_2: 35.2,
    snf8_3: 35.46,
    snf8_4: 35.71,
    snf8_5: 35.97,
  },
  {
    fat: 3.8,
    snf8_0: 35.07,
    snf8_1: 35.33,
    snf8_2: 35.58,
    snf8_3: 35.84,
    snf8_4: 36.1,
    snf8_5: 36.35,
  },
  {
    fat: 3.9,
    snf8_0: 35.46,
    snf8_1: 35.71,
    snf8_2: 35.97,
    snf8_3: 36.22,
    snf8_4: 36.48,
    snf8_5: 36.74,
  },
  {
    fat: 4.0,
    snf8_0: 35.84,
    snf8_1: 36.1,
    snf8_2: 36.35,
    snf8_3: 36.61,
    snf8_4: 36.86,
    snf8_5: 37.12,
  },
  {
    fat: 4.5,
    snf8_0: 37.76,
    snf8_1: 38.02,
    snf8_2: 38.27,
    snf8_3: 38.53,
    snf8_4: 38.78,
    snf8_5: 39.04,
  },
  {
    fat: 5.0,
    snf8_0: 39.68,
    snf8_1: 39.94,
    snf8_2: 40.19,
    snf8_3: 40.45,
    snf8_4: 40.7,
    snf8_5: 40.96,
  },
  {
    fat: 5.5,
    snf8_0: 41.6,
    snf8_1: 41.85,
    snf8_2: 42.11,
    snf8_3: 42.36,
    snf8_4: 42.62,
    snf8_5: 42.87,
  },
  {
    fat: 6.0,
    snf8_0: 43.52,
    snf8_1: 43.77,
    snf8_2: 44.03,
    snf8_3: 44.28,
    snf8_4: 44.54,
    snf8_5: 44.79,
  },
  {
    fat: 6.5,
    snf8_0: 45.44,
    snf8_1: 45.69,
    snf8_2: 45.95,
    snf8_3: 46.2,
    snf8_4: 46.46,
    snf8_5: 46.71,
  },
  {
    fat: 7.0,
    snf8_0: 47.36,
    snf8_1: 47.61,
    snf8_2: 47.87,
    snf8_3: 48.12,
    snf8_4: 48.38,
    snf8_5: 48.63,
  },
];

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
  const [rateChart] = useState<RateChartRow[]>(defaultRateChart);

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
            {rateChart.map((row, index) => (
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
    <View style={styles.container}>
      {/* Content */}<FarmerRateChartHeader />
      {renderRateChart()}
    </View>
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
