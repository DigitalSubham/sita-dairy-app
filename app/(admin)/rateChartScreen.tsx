import EditableRateChart from "@/components/admin/rateChart/EditableRateChart"
import { RateChartHeader } from "@/components/common/HeaderVarients"
import { defaultRateChart } from "@/constants/rateData"
import * as DocumentPicker from "expo-document-picker"
import { useState } from "react"
import { Alert, StyleSheet, View } from "react-native"

export interface RateChartRow {
    id: string
    fat: number
    snf8_0: number
    snf8_1: number
    snf8_2: number
    snf8_3: number
    snf8_4: number
    snf8_5: number
    [key: string]: string | number // Allow dynamic columns
}

export interface ChartColumn {
    key: string
    label: string
    type: "number" | "text"
    editable: boolean
}

export interface ApiResponse {
    chart: RateChartRow[]
    columns: ChartColumn[]
    success: boolean
    message?: string
}


const RateChartScreen = () => {
    const [rateChart, setRateChart] = useState<RateChartRow[]>(defaultRateChart)

    const [columns, setColumns] = useState<ChartColumn[]>([
        { key: "fat", label: "Fat %", type: "number", editable: true },
        { key: "snf8_0", label: "8.0", type: "number", editable: true },
        { key: "snf8_1", label: "8.1", type: "number", editable: true },
        { key: "snf8_2", label: "8.2", type: "number", editable: true },
        { key: "snf8_3", label: "8.3", type: "number", editable: true },
        { key: "snf8_4", label: "8.4", type: "number", editable: true },
        { key: "snf8_5", label: "8.5", type: "number", editable: true },
    ])

    const [loading, setLoading] = useState(false)
    const [editingCell, setEditingCell] = useState<{
        rowId: string
        columnKey: string
    } | null>(null)

    // Handle cell edit
    const handleCellEdit = (rowId: string, columnKey: string, value: string) => {
        const newChart = rateChart.map((row) => {
            if (row.id === rowId) {
                return {
                    ...row,
                    [columnKey]: Number.parseFloat(value) || 0,
                }
            }
            return row
        })
        setRateChart(newChart)
        setEditingCell(null)
    }

    // Add new row
    const addRow = () => {
        const lastRow = rateChart[rateChart.length - 1]
        const newId = (Number.parseInt(lastRow.id) + 1).toString()

        const newRow: RateChartRow = {
            id: newId,
            fat: lastRow.fat + 0.1,
            snf8_0: lastRow.snf8_0 + 1.0,
            snf8_1: lastRow.snf8_1 + 1.0,
            snf8_2: lastRow.snf8_2 + 1.0,
            snf8_3: lastRow.snf8_3 + 1.0,
            snf8_4: lastRow.snf8_4 + 1.0,
            snf8_5: lastRow.snf8_5 + 1.0,
        }

        setRateChart([...rateChart, newRow])
    }

    // Remove row
    const removeRow = (rowId: string) => {
        if (rateChart.length > 1) {
            setRateChart(rateChart.filter((row) => row.id !== rowId))
        } else {
            Alert.alert("Error", "Cannot remove the last row")
        }
    }

    // Add new column
    const addColumn = () => {
        Alert.prompt(
            "Add Column",
            "Enter column label:",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Add",
                    onPress: (label) => {
                        if (label && label.trim()) {
                            const newKey = `custom_${Date.now()}`
                            const newColumn: ChartColumn = {
                                key: newKey,
                                label: label.trim(),
                                type: "number",
                                editable: true,
                            }

                            setColumns([...columns, newColumn])

                            // Add the new column to all existing rows
                            const updatedChart = rateChart.map((row) => ({
                                ...row,
                                [newKey]: 0,
                            }))
                            setRateChart(updatedChart)
                        }
                    },
                },
            ],
            "plain-text",
        )
    }

    // Remove column
    const removeColumn = (columnKey: string) => {
        if (columns.length > 1) {
            Alert.alert("Remove Column", "Are you sure you want to remove this column?", [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Remove",
                    style: "destructive",
                    onPress: () => {
                        setColumns(columns.filter((col) => col.key !== columnKey))

                        // Remove the column from all rows
                        const updatedChart = rateChart.map((row) => {
                            const { [columnKey]: removed, ...rest } = row
                            return rest
                        })
                        // setRateChart(updatedChart)
                    },
                },
            ])
        } else {
            Alert.alert("Error", "Cannot remove the last column")
        }
    }

    // Upload Excel file
    const uploadExcelFile = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-excel"],
                copyToCacheDirectory: true,
            })

            if (!result.canceled && result.assets[0]) {
                setLoading(true)
                const file = result.assets[0]

                // Create FormData for file upload
                const formData = new FormData()
                formData.append("file", {
                    uri: file.uri,
                    type: file.mimeType || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    name: file.name,
                } as any)

                // Replace with your actual API endpoint
                const response = await fetch("YOUR_API_ENDPOINT/upload-excel", {
                    method: "POST",
                    body: formData,
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                })

                if (response.ok) {
                    const data = await response.json()
                    Alert.alert("Success", "Excel file uploaded successfully!")
                    // Optionally refresh data from server
                    await fetchDataFromServer()
                } else {
                    throw new Error("Upload failed")
                }
            }
        } catch (error) {
            Alert.alert("Error", "Failed to upload Excel file")
            console.error("Upload error:", error)
        } finally {
            setLoading(false)
        }
    }

    // Fetch data from server
    const fetchDataFromServer = async () => {
        try {
            setLoading(true)

            // Replace with your actual API endpoint
            const response = await fetch("YOUR_API_ENDPOINT/rate-chart")

            if (response.ok) {
                const data = await response.json()

                if (data.chart && data.columns) {
                    setRateChart(data.chart)
                    setColumns(data.columns)
                }
            } else {
                throw new Error("Failed to fetch data")
            }
        } catch (error) {
            Alert.alert("Error", "Failed to fetch data from server")
            console.error("Fetch error:", error)
        } finally {
            setLoading(false)
        }
    }

    // Save data to server
    const saveDataToServer = async () => {
        try {
            setLoading(true)

            const payload = {
                chart: rateChart,
                columns: columns,
            }

            // Replace with your actual API endpoint
            const response = await fetch("YOUR_API_ENDPOINT/rate-chart", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            })

            if (response.ok) {
                Alert.alert("Success", "Data saved successfully!")
            } else {
                throw new Error("Save failed")
            }
        } catch (error) {
            Alert.alert("Error", "Failed to save data")
            console.error("Save error:", error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <View style={styles.container}>
            <RateChartHeader fetchDataFromServer={fetchDataFromServer} saveDataToServer={saveDataToServer} />


            {/* Loading Indicator */}
            {/* {loading && (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#0ea5e9" />
                    <Text style={styles.loadingText}>Processing...</Text>
                </View>
            )} */}

            {/* Chart Controls */}
            {/* <View style={styles.controls}>
                <TouchableOpacity style={styles.controlButton} onPress={addRow}>
                    <Ionicons name="add-circle-outline" size={20} color="#0ea5e9" />
                    <Text style={styles.controlButtonText}>Row</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.controlButton} onPress={addColumn}>
                    <Ionicons name="add-circle-outline" size={20} color="#0ea5e9" />
                    <Text style={styles.controlButtonText}>Column</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.controlButton} onPress={uploadExcelFile}>
                    <Ionicons name="cloud-upload-outline" size={20} color="#0ea5e9" />
                    <Text style={styles.controlButtonText}>Excel</Text>
                </TouchableOpacity>
            </View> */}

            {/* Editable Chart */}
            <EditableRateChart
                rateChart={rateChart}
                columns={columns}
                editingCell={editingCell}
                setEditingCell={setEditingCell}
                handleCellEdit={handleCellEdit}
                removeRow={removeRow}
                removeColumn={removeColumn}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f8fafc",

    },
    loadingContainer: {
        alignItems: "center",
        padding: 20,
    },
    loadingText: {
        marginTop: 8,
        color: "#64748b",
        fontSize: 14,
    },
    controls: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        marginBottom: 16,
    },
    controlButton: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: "white",
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#e2e8f0",
        gap: 6,
    },
    controlButtonText: {
        color: "#0ea5e9",
        fontWeight: "600",
        fontSize: 14,
    },
})

export default RateChartScreen
