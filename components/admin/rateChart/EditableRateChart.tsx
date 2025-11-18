
import { Ionicons } from "@expo/vector-icons"
import React, { useState } from "react"
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native"


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


interface EditableRateChartProps {
    rateChart: RateChartRow[]
    columns: ChartColumn[]
    editingCell: { rowId: string; columnKey: string } | null
    setEditingCell: (cell: { rowId: string; columnKey: string } | null) => void
    handleCellEdit: (rowId: string, columnKey: string, value: string) => void
    removeRow: (rowId: string) => void
    removeColumn: (columnKey: string) => void
}

interface EditableCellProps {
    value: number
    rowId: string
    columnKey: string
    editingCell: { rowId: string; columnKey: string } | null
    setEditingCell: (cell: { rowId: string; columnKey: string } | null) => void
    handleCellEdit: (rowId: string, columnKey: string, value: string) => void
    editable: boolean
}

const EditableCell: React.FC<EditableCellProps> = ({
    value,
    rowId,
    columnKey,
    editingCell,
    setEditingCell,
    handleCellEdit,
    editable,
}) => {
    const [text, setText] = useState(value.toString())
    const isEditing = editingCell?.rowId === rowId && editingCell?.columnKey === columnKey

    React.useEffect(() => {
        if (!isEditing) {
            setText(value.toString())
        }
    }, [value, isEditing])

    if (isEditing && editable) {
        return (
            <TextInput
                style={styles.cellInput}
                value={text}
                onChangeText={setText}
                onBlur={() => {
                    handleCellEdit(rowId, columnKey, text)
                }}
                onSubmitEditing={() => {
                    handleCellEdit(rowId, columnKey, text)
                }}
                keyboardType="decimal-pad"
                autoFocus
                selectTextOnFocus
            />
        )
    }

    return (
        <TouchableOpacity
            style={[styles.cellTouchable, !editable && styles.cellDisabled]}
            // onPress={() => editable && setEditingCell({ rowId, columnKey })}
            disabled={!editable}
        >
            <Text style={[styles.cellText, !editable && styles.cellTextDisabled]}>
                {value === undefined || value === null
                    ? ""
                    : typeof value === "number"
                        ? value.toFixed(2)
                        : String(value)}
            </Text>

        </TouchableOpacity>
    )
}

const EditableRateChart: React.FC<EditableRateChartProps> = ({
    rateChart,
    columns,
    editingCell,
    setEditingCell,
    handleCellEdit,
    removeRow,
    removeColumn,
}) => {
    const [showColumnActions, setShowColumnActions] = useState<string | null>(null)
    const [showRowActions, setShowRowActions] = useState<string | null>(null)

    const handleRemoveColumn = (columnKey: string) => {
        Alert.alert("Remove Column", "Are you sure you want to remove this column?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Remove",
                style: "destructive",
                onPress: () => removeColumn(columnKey),
            },
        ])
        setShowColumnActions(null)
    }

    const handleRemoveRow = (rowId: string) => {
        Alert.alert("Remove Row", "Are you sure you want to remove this row?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Remove",
                style: "destructive",
                onPress: () => removeRow(rowId),
            },
        ])
        setShowRowActions(null)
    }

    return (
        <View style={styles.container}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.table}>
                    {/* Header Row */}
                    <View style={styles.headerRow}>
                        {columns.map((column) => (
                            <View key={column.key} style={styles.headerCellContainer}>
                                <TouchableOpacity style={styles.headerCell} onLongPress={() => setShowColumnActions(column.key)}>
                                    <Text style={styles.headerCellText}>{column.label}</Text>
                                    {showColumnActions === column.key && (
                                        <TouchableOpacity style={styles.removeButton} onPress={() => handleRemoveColumn(column.key)}>
                                            <Ionicons name="close-circle" size={16} color="#ef4444" />
                                        </TouchableOpacity>
                                    )}
                                </TouchableOpacity>
                            </View>
                        ))}
                        <View style={styles.headerCell}>
                            <Text style={styles.headerCellText}>Actions</Text>
                        </View>
                    </View>

                    {/* Data Rows */}
                    <ScrollView style={styles.dataContainer}>
                        {rateChart.map((row) => (
                            <View key={row.id} style={styles.dataRow}>
                                {columns.map((column) => (
                                    <EditableCell
                                        key={`${row.id}-${column.key}`}
                                        value={row[column.key] as number}
                                        rowId={row.id}
                                        columnKey={column.key}
                                        editingCell={editingCell}
                                        setEditingCell={setEditingCell}
                                        handleCellEdit={handleCellEdit}
                                        editable={column.editable}
                                    />
                                ))}
                                <View style={styles.actionCell}>
                                    <TouchableOpacity style={styles.rowActionButton} onPress={() => handleRemoveRow(row.id)}>
                                        <Ionicons name="trash-outline" size={16} color="#ef4444" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                    </ScrollView>
                </View>
            </ScrollView>

            {/* Instructions */}
            <View style={styles.instructions}>
                <Text style={styles.instructionText}>
                    💡 Tap any cell to edit • Long press column headers to remove columns • Use action buttons to remove rows
                </Text>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "white",
        borderRadius: 12,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
        marginBottom: 32,
        marginHorizontal: 16,
    },
    table: {
        minWidth: "100%",
    },
    headerRow: {
        flexDirection: "row",
        backgroundColor: "#0ea5e9",
    },
    headerCellContainer: {
        position: "relative",
    },
    headerCell: {
        width: 100,
        paddingVertical: 16,
        paddingHorizontal: 8,
        justifyContent: "center",
        alignItems: "center",
        borderRightWidth: 1,
        borderRightColor: "rgba(255, 255, 255, 0.2)",
    },
    headerCellText: {
        color: "white",
        fontWeight: "bold",
        fontSize: 14,
        textAlign: "center",
    },
    removeButton: {
        position: "absolute",
        top: 2,
        right: 2,
        backgroundColor: "white",
        borderRadius: 8,
        padding: 2,
    },
    dataContainer: {
        flex: 1,
    },
    dataRow: {
        flexDirection: "row",
        borderBottomWidth: 1,
        borderBottomColor: "#e2e8f0",
    },
    cellTouchable: {
        width: 100,
        paddingVertical: 16,
        paddingHorizontal: 8,
        justifyContent: "center",
        alignItems: "center",
        borderRightWidth: 1,
        borderRightColor: "#e2e8f0",
        backgroundColor: "white",
    },
    cellDisabled: {
        backgroundColor: "#f8fafc",
    },
    cellText: {
        fontSize: 14,
        color: "#334155",
        textAlign: "center",
    },
    cellTextDisabled: {
        color: "#94a3b8",
    },
    cellInput: {
        width: 100,
        paddingVertical: 16,
        paddingHorizontal: 8,
        fontSize: 14,
        color: "#334155",
        textAlign: "center",
        backgroundColor: "#f0f9ff",
        borderWidth: 2,
        borderColor: "#0ea5e9",
    },
    actionCell: {
        width: 100,
        paddingVertical: 16,
        paddingHorizontal: 8,
        justifyContent: "center",
        alignItems: "center",
        borderRightWidth: 1,
        borderRightColor: "#e2e8f0",
    },
    rowActionButton: {
        padding: 8,
        borderRadius: 6,
        backgroundColor: "#fef2f2",
    },
    instructions: {
        backgroundColor: "#fef3c7",
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: "#fbbf24",
    },
    instructionText: {
        color: "#92400e",
        fontSize: 12,
        textAlign: "center",
        lineHeight: 16,
    },
})

export default EditableRateChart
