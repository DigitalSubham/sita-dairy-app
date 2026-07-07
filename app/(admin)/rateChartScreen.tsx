import EditableRateChart from "@/components/admin/rateChart/EditableRateChart"
import RateModal from "@/components/admin/RateModal"
import { RateChartHeader } from "@/components/common/HeaderVarients"
import { api } from "@/constants/api"
import { stringNumber } from "@/constants/types"
import { Ionicons } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useFocusEffect } from "expo-router"
import { useCallback, useState } from "react"
import { useTranslation } from "react-i18next"
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

export interface RateChartRow {
    _id: string
    fat: number
    snf8_0: number
    snf8_1: number
    snf8_2: number
    snf8_3: number
    snf8_4: number
    snf8_5: number
    [key: string]: string | number | boolean
}

export interface ChartColumn {
    key: string
    label: string
    type: "number" | "text"
    editable: boolean
}

export interface ApiResponse {
    row: RateChartRow[]
    columns: ChartColumn[]
    success: boolean
    message?: string
}

export type editingCell = {
    rowId: stringNumber;
    columnKey: stringNumber;
    fatKey: stringNumber;
    cellValue: stringNumber;
} | null;

export type EditingHeader = {
    columnKey: string
    value: string
} | null


const RateChartScreen = () => {
    const { t } = useTranslation()
    const [rateChart, setRateChart] = useState<RateChartRow[]>([])
    const [columns, setColumns] = useState<ChartColumn[]>([])
    const [showColumnModal, setShowColumnModal] = useState(false);
    const [loading, setLoading] = useState(false)
    const [editingCell, setEditingCell] = useState<editingCell>(null)
    const [editingHeader, setEditingHeader] = useState<EditingHeader>(null)


    // Handle cell edit
    const handleCellEdit = (editingCell: editingCell, value: stringNumber) => {
        if (!editingCell) return
        const newChart = rateChart.map((row) => {
            if (row._id === editingCell.rowId) {
                return {
                    ...row,
                    [editingCell.columnKey]: value,
                    isCellEdited: `${editingCell.rowId}-${editingCell.columnKey}`
                }
            }
            return row
        })
        setRateChart(newChart)
        setEditingCell(null)
    }

    const handleHeaderEdit = (columnKey: string, value: string) => {
        setColumns(prev =>
            prev.map(col =>
                col.key === columnKey
                    ? { ...col, label: value, isEdited: columnKey }
                    : col
            )
        )

        setEditingHeader(null)
    }

    const confirmAddRow = () => {
        Alert.alert(
            t("rate.add_row"),
            t("rate.add_row_confirmation"),
            [
                { text: t("common.cancel"), style: "cancel" },
                {
                    text: t("common.add"),
                    onPress: addRow,
                },
            ]
        );
    };
    // Add new row
    const addRow = () => {
        if (!columns.length) return;

        const newRow: RateChartRow = {
            _id: Date.now().toString(),
        } as RateChartRow;

        if (!rateChart.length) {
            // No rows yet (fresh rate chart) — seed the first row with zeros
            columns.forEach(col => {
                if (col.key === "_id") return;
                newRow[col.key] = 0;
            });
        } else {
            const firstKey = columns[0].key;
            const sortedChart = [...rateChart].sort((a, b) => {
                const valA = Number(a[firstKey]) || 0;
                const valB = Number(b[firstKey]) || 0;
                return valA - valB;
            });

            const lastRow = sortedChart[rateChart.length - 1];

            columns.forEach(col => {
                if (col.key === "_id") return;

                newRow[col.key] =
                    typeof lastRow[col.key] === "number"
                        ? Number(lastRow[col.key]) + 1
                        : 0;
            });
        }

        setRateChart(prev => [...prev, { ...newRow, isCellEdited: `new-${newRow._id}` }]);
    };

    const confirmRemoveRow = (rowId: string) => {
        if (rateChart.length <= 1) {
            Alert.alert(t("common.error"), t("rate.at_least_one_row"));
            return;
        }

        Alert.alert(
            t("rate.delete_row"),
            t("rate.delete_row_confirmation"),
            [
                { text: t("common.cancel"), style: "cancel" },
                {
                    text: t("common.delete"),
                    style: "destructive",
                    onPress: () => {
                        setRateChart(prev => prev.filter(row => row._id !== rowId));
                    },
                },
            ]
        );
    };


    // Remove column
    const removeColumn = (columnKey: string) => {
        if (columns[0]?.key === columnKey) {
            Alert.alert(t("common.error"), t("rate.cannot_remove_primary_column"));
            return;
        }

        if (columns.length <= 1) {
            Alert.alert(t("common.error"), t("rate.cannot_remove_last_column"));
            return;
        }

        Alert.alert(t("rate.remove_column"), t("rate.are_you_sure"), [
            { text: t("common.cancel"), style: "cancel" },
            {
                text: t("common.delete"),
                style: "destructive",
                onPress: () => {
                    setColumns(prev => prev.filter(col => col.key !== columnKey));

                    setRateChart(prev =>
                        prev.map(row => {
                            const { [columnKey]: _, ...rest } = row;
                            return rest as RateChartRow;
                        })
                    );
                },
            },
        ]);
    };


    const addColumn = () => {
        setShowColumnModal(true);
    };

    const confirmAddColumn = (label: string) => {
        const trimmed = label.trim();
        if (!trimmed) return;

        if (columns.some(col => col.label === trimmed)) {
            Alert.alert(t("common.error"), t("rate.column_already_exists"));
            return;
        }

        const key = `col_${crypto.randomUUID()}`;

        const newColumn: ChartColumn = {
            key,
            label: trimmed,
            type: "number",
            editable: true,
        };

        setColumns(prev => [...prev, newColumn]);

        setRateChart(prev =>
            prev.map(row => ({
                ...row,
                [key]: 0,
            }))
        );

        setShowColumnModal(false);
    };

    const fetchDataFromServer = async () => {
        const token = await AsyncStorage.getItem("token");
        const parsedToken = token ? JSON.parse(token) : null;
        try {
            setLoading(true)

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
                setColumns(data.column)
            } else {
                Alert.alert(t("common.error"), data.message || t("records.failed_fetch_entries"))
            }

        } catch (error) {
            Alert.alert(t("common.error"), t("records.failed_fetch_entries"))
            console.error("Fetch error:", error)
        } finally {
            setLoading(false)
        }
    }


    // Save data to server
    const saveDataToServer = async () => {
        const token = await AsyncStorage.getItem("token");
        const parsedToken = token ? JSON.parse(token) : null;
        try {
            setLoading(true)

            const editedRows = rateChart.filter(row => row.isCellEdited)

            for (const row of editedRows) {
                const isNewRow = typeof row.isCellEdited === "string" && row.isCellEdited.startsWith("new-")
                const { _id, isCellEdited, ...rowData } = row

                const url = isNewRow ? api.rateChart : `${api.rateChart}/${_id}`
                const method = isNewRow ? "POST" : "PUT"

                const response = await fetch(url, {
                    method,
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${parsedToken}`
                    },
                    body: JSON.stringify(rowData),
                })

                if (!response.ok) {
                    const responseText = await response.text()
                    throw new Error(`Save failed (${response.status}): ${responseText}`)
                }
            }

            Alert.alert(t("common.success"), t("rate.data_saved_successfully"))
            fetchDataFromServer()
        }

        catch (error) {
            Alert.alert(t("common.error"), t("rate.failed_to_save_data"))
            console.error("Save error:", error)
        } finally {
            setLoading(false)
        }
    }

    useFocusEffect(useCallback(() => {
        fetchDataFromServer()
    }, []))


    return (
        <SafeAreaView style={styles.container}>
            <RateChartHeader fetchDataFromServer={fetchDataFromServer} saveDataToServer={saveDataToServer} />

            <View style={styles.controls}>
                <TouchableOpacity style={styles.controlButton} onPress={confirmAddRow}>
                    <Ionicons name="add-circle-outline" size={20} color="#0ea5e9" />
                    <Text style={styles.controlButtonText}>{t("rate.add_row")}</Text>
                </TouchableOpacity>

                {loading && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#0ea5e9" />
                    </View>
                )}
            </View>

            {/* Editable Chart */}
            {rateChart.length > 0 ? (
                <EditableRateChart
                    rateChart={rateChart}
                    columns={columns}
                    editingCell={editingCell}
                    setEditingCell={setEditingCell}
                    removeRow={confirmRemoveRow}
                    removeColumn={removeColumn}
                    setEditingHeader={setEditingHeader}
                />
            ) : !loading ? (
                <View style={styles.emptyState}>
                    <Ionicons name="grid-outline" size={48} color="#94a3b8" />
                    <Text style={styles.emptyStateTitle}>{t("rate.no_data_title")}</Text>
                    <Text style={styles.emptyStateMessage}>{t("rate.no_data_message")}</Text>
                </View>
            ) : null}
            <RateModal
                visible={!!editingHeader}
                modalheadertext={t("rate.edit_column_name")}
                textValue={editingHeader?.value}
                setVisible={() => setEditingHeader(null)}
                submitFn={(value: string) =>
                    handleHeaderEdit(editingHeader!.columnKey, value)
                }
            />
            <RateModal visible={showColumnModal} setVisible={setShowColumnModal} submitFn={confirmAddColumn} modalheadertext={t("rate.add_column")} />
            <RateModal modalheadertext={`${t("rate.edit_cell")} fat${Number(editingCell?.fatKey)?.toFixed(2)} - ${editingCell?.columnKey}`} visible={!!editingCell} setVisible={(value: boolean) => setEditingCell(null)} textValue={editingCell?.cellValue} submitFn={(value: stringNumber) => handleCellEdit(editingCell, value)} />
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f8fafc",
    },
    loadingContainer: {
        alignItems: "center",
    },
    loadingText: {
        color: "#64748b",
        fontSize: 14,
    },
    controls: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        marginBottom: 16,
        marginHorizontal: 16,
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
    emptyState: {
        alignItems: "center",
        justifyContent: "center",
        marginHorizontal: 16,
        marginTop: 40,
        gap: 8,
    },
    emptyStateTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#334155",
        marginTop: 8,
    },
    emptyStateMessage: {
        fontSize: 14,
        color: "#64748b",
        textAlign: "center",
    },
})

export default RateChartScreen
