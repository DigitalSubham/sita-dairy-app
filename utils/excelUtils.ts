// Utility functions for Excel handling

// Declare RateChartRow and ChartColumn types
export type RateChartRow = {
  id: string;
  fat: number;
  snf8_0: number;
  snf8_1: number;
  snf8_2: number;
  snf8_3: number;
  snf8_4: number;
  snf8_5: number;
  [key: string]: any; // Allow additional properties
};

export type ChartColumn = {
  label: string;
  key: string;
};

// Validate Excel data
export const validateExcelData = (data: any[]): boolean => {
  if (!Array.isArray(data) || data.length === 0) {
    return false;
  }

  // Check if first row has required columns
  const firstRow = data[0];
  const requiredColumns = ["fat"];

  return requiredColumns.every((col) => col in firstRow);
};

// Transform Excel data to RateChart format
export const transformExcelToRateChart = (data: any[]): RateChartRow[] => {
  return data.map((row, index) => ({
    id: (index + 1).toString(),
    fat: Number.parseFloat(row.fat) || 0,
    snf8_0: Number.parseFloat(row.snf8_0) || 0,
    snf8_1: Number.parseFloat(row.snf8_1) || 0,
    snf8_2: Number.parseFloat(row.snf8_2) || 0,
    snf8_3: Number.parseFloat(row.snf8_3) || 0,
    snf8_4: Number.parseFloat(row.snf8_4) || 0,
    snf8_5: Number.parseFloat(row.snf8_5) || 0,
    ...row, // Include any additional columns
  }));
};

// Export data to Excel format
export const exportToExcelFormat = (
  rateChart: RateChartRow[],
  columns: ChartColumn[]
) => {
  const headers = columns.map((col) => col.label);
  const data = rateChart.map((row) =>
    columns.reduce((acc, col) => {
      acc[col.label] = row[col.key];
      return acc;
    }, {} as any)
  );

  return {
    headers,
    data,
  };
};
