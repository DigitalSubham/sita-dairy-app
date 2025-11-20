import { Feather, Ionicons } from "@expo/vector-icons"
import React, { useState } from "react"
import {
    FlatList,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native"

export interface RateChartRow {
    id: string
    fat: number
    snf8_0: number
    snf8_1: number
    snf8_2: number
    snf8_3: number
    snf8_4: number
    snf8_5: number
    [key: string]: string | number
}

export interface ChartColumn {
    key: string
    label: string
    type: "number" | "text"
    editable: boolean
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
    const [text, setText] = React.useState(value?.toString() || "")
    const isEditing = editingCell?.rowId === rowId && editingCell?.columnKey === columnKey

    React.useEffect(() => {
        if (!isEditing) setText(value?.toString() || "")
    }, [value, isEditing])

    if (isEditing && editable) {
        return (
            <TextInput
                style={styles.cellInput}
                value={text}
                onChangeText={setText}
                onBlur={() => handleCellEdit(rowId, columnKey, text)}
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
                {typeof value === "number" ? value.toFixed(2) : value}
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

    const sortedRateChart = React.useMemo(() => {
        if (columns.length === 0) return rateChart;

        const firstKey = columns[0].key;

        return [...rateChart].sort((a, b) => {
            const valA = Number(a[firstKey]) || 0;
            const valB = Number(b[firstKey]) || 0;
            return valA - valB;   // ascending
        });
    }, [rateChart, columns]);

    const renderRow = ({ item }: { item: any }) => {
        return (
            <View style={styles.dataRow}>
                {columns.map((column) => (
                    <EditableCell
                        key={`${item.id}-${column.key}`}
                        value={item[column.key]}
                        rowId={item.id}
                        columnKey={column.key}
                        editingCell={editingCell}
                        setEditingCell={setEditingCell}
                        handleCellEdit={handleCellEdit}
                        editable={column.editable}
                    />
                ))}

                {<View style={styles.actionCell}>
                    <TouchableOpacity
                        style={styles.rowActionButton}
                    // onPress={() => removeRow(item.id)}
                    >
                        <Ionicons name="trash-outline" size={18} color="#ef4444" />
                    </TouchableOpacity>
                </View>}
            </View>
        )
    }

    return (
        <View style={styles.boxContainer}>
            {/* Horizontal scroll for columns */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View>
                    {/* HEADER */}
                    <View style={styles.headerRow}>
                        {columns.map((column) => (
                            <TouchableOpacity
                                key={column.key}
                                style={styles.headerCell}
                            // onLongPress={() => setShowColumnActions(column.key)}
                            >
                                <Text style={styles.headerText}>{column.label}</Text>

                                {showColumnActions === column.key && (
                                    <TouchableOpacity
                                        style={styles.removeButton}
                                    // onPress={() => removeColumn(column.key)}
                                    >
                                        <Ionicons name="close-circle" size={16} color="#ef4444" />
                                    </TouchableOpacity>
                                )}
                                {column.key === "snf8_5" && (
                                    <TouchableOpacity
                                        style={styles.removeButton}
                                    // onPress={() => removeColumn(column.key)}
                                    >
                                        <Feather name="plus-circle" size={16} color="#44ef52ff" />
                                    </TouchableOpacity>
                                )}
                            </TouchableOpacity>
                        ))}

                        <View style={styles.headerCell}>
                            <Text style={styles.headerText}>Actions</Text>
                        </View>
                    </View>

                    {/* VERTICAL LIST (inside fixed-height box) */}
                    <FlatList
                        data={sortedRateChart}
                        keyExtractor={(item) => item.id}
                        renderItem={renderRow}
                        nestedScrollEnabled
                        style={styles.list}
                        contentContainerStyle={{ paddingBottom: 20 }}
                    />
                </View>
            </ScrollView>
        </View>
    )
}

const styles = StyleSheet.create({
    boxContainer: {
        height: "80%",
        backgroundColor: "#fff",
        margin: 16,
        borderRadius: 12,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "#e2e8f0",
        elevation: 3,
    },
    headerRow: {
        flexDirection: "row",
        backgroundColor: "#0ea5e9",
    },
    headerCell: {
        width: 100,
        padding: 14,
        borderRightWidth: 1,
        borderRightColor: "#38bdf8",
        alignItems: "center",
        justifyContent: "center",
    },
    headerText: {
        color: "white",
        fontWeight: "600",
    },
    removeButton: {
        position: "absolute",
        top: 4,
        right: 4,
        backgroundColor: "white",
        padding: 2,
        borderRadius: 10,
    },
    dataRow: {
        flexDirection: "row",
        borderBottomWidth: 1,
        borderBottomColor: "#e5e7eb",
    },
    cellTouchable: {
        width: 100,
        padding: 14,
        alignItems: "center",
        justifyContent: "center",
        borderRightWidth: 1,
        borderRightColor: "#e5e7eb",
    },
    cellDisabled: {
        backgroundColor: "#f8fafc",
    },
    cellText: {
        fontSize: 14,
        color: "#1e293b",
    },
    cellTextDisabled: {
        color: "#94a3b8",
    },
    cellInput: {
        width: 100,
        padding: 14,
        fontSize: 14,
        backgroundColor: "#f0f9ff",
        textAlign: "center",
        borderWidth: 2,
        borderColor: "#0ea5e9",
    },
    actionCell: {
        width: 100,
        justifyContent: "center",
        alignItems: "center",
        borderLeftWidth: 1,
        borderLeftColor: "#e5e7eb",
    },
    rowActionButton: {
        padding: 8,
        backgroundColor: "#fee2e2",
        borderRadius: 6,
    },
    list: {
        maxHeight: "100%", // inside the 400 px box (header + content)
    },
})

export default EditableRateChart
