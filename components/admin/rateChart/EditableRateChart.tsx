import { editingCell, EditingHeader } from "@/app/(admin)/rateChartScreen"
import { stringNumber } from "@/constants/types"
import { Ionicons } from "@expo/vector-icons"
import React from "react"
import {
    FlatList,
    ListRenderItemInfo,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native"

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


interface EditableRateChartProps {
    rateChart: RateChartRow[]
    columns: ChartColumn[]
    setEditingCell: (cell: editingCell | null) => void
    removeRow: (rowId: string) => void
    removeColumn: (columnKey: string) => void
    editingCell: editingCell
    setEditingHeader: (val: EditingHeader) => void
}

interface EditableCellProps {
    value: number
    rowId: stringNumber
    columnKey: string
    setEditingCell: (cell: editingCell | null) => void
    firstColumn: boolean
    isCellEdited: string | number | boolean
    fatKey: stringNumber
}

const EditableCell: React.FC<EditableCellProps> = ({
    value,
    rowId,
    columnKey,
    setEditingCell,
    firstColumn,
    isCellEdited,
    fatKey
}) => {

    return (
        <TouchableOpacity
            style={[styles.cellTouchable, firstColumn && styles.firstColumn]}
            onPress={() => setEditingCell({ rowId, columnKey, cellValue: value, fatKey: fatKey })}
        >
            <Text style={[styles.cellText, firstColumn && styles.headerText, isCellEdited === `${rowId}-${columnKey}` && styles.editedCell]}>
                {typeof value === "number" ? value.toFixed(2) : value}
            </Text>
        </TouchableOpacity>
    )
}

const EditableRateChart: React.FC<EditableRateChartProps> = ({
    rateChart,
    columns,
    setEditingCell,
    removeRow,
    removeColumn,
    editingCell,
    setEditingHeader
}) => {

    const sortedRateChart = React.useMemo(() => {
        // ⛔ do not sort while editing any cell
        if (editingCell) {
            return rateChart;
        }

        if (columns.length === 0) return rateChart;

        const firstKey = columns[0].key;

        return [...rateChart].sort((a, b) => {
            const valA = Number(a[firstKey]) || 0;
            const valB = Number(b[firstKey]) || 0;
            return valA - valB;
        });
    }, [rateChart, columns, editingCell]);

    const RenderRow = ({ item }: ListRenderItemInfo<RateChartRow>) => {
        return (
            <View style={styles.dataRow}>
                {columns.map((column, index) => (
                    <EditableCell
                        key={`${item._id}-${column.key}`}
                        value={Number(item[column.key])}
                        firstColumn={index === 0}
                        rowId={item._id}
                        columnKey={column.key}
                        setEditingCell={setEditingCell}
                        isCellEdited={item?.isCellEdited}
                        fatKey={item.fat}
                    />
                ))}

                {(
                    <View style={styles.actionCell}>
                        <TouchableOpacity
                            style={styles.rowActionButton}
                            onPress={() => removeRow(item._id)}
                        >
                            <Ionicons name="trash-outline" size={18} color="#ef4444" />
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        );
    };

    return (
        <View style={styles.boxContainer}>
            {/* Horizontal scroll for columns */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View>
                    {/* HEADER */}
                    <View style={styles.headerRow}>
                        {columns.map((column, index) => (
                            <TouchableOpacity
                                key={column.key}
                                onPress={() => {
                                    if (index === 0) return
                                    setEditingHeader({
                                        columnKey: column.key,
                                        value: column.label
                                    })
                                }
                                }
                                style={index === 0 ? styles.matrixHeaderCell : styles.headerCell}
                            >
                                {index === 0 ? (
                                    <View style={styles.matrixHeader}>
                                        <View style={styles.snfHeader}>
                                            <Text style={styles.headerText}>SNF %</Text>
                                            <Ionicons name="arrow-forward" size={14} color="white" />
                                        </View>

                                        <View style={styles.fatHeader}>
                                            <Text style={styles.headerText}>FAT %</Text>
                                            <Ionicons name="arrow-down" size={14} color="white" />
                                        </View>
                                    </View>

                                ) : (
                                    <Text style={styles.headerText}>{column.label}</Text>
                                )}


                                {index !== 0 && (
                                    <TouchableOpacity
                                        style={styles.removeButton}
                                        onPress={() => removeColumn(column.key)}
                                    >
                                        <Ionicons name="close-circle" size={16} color="#ef4444" />
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
                        keyExtractor={(item) => item._id}
                        renderItem={RenderRow}
                        nestedScrollEnabled
                        style={styles.list}
                        contentContainerStyle={{ paddingBottom: 20 }}
                        extraData={sortedRateChart}
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
    },
    headerCell: {
        width: 90,
        padding: 14,
        borderRightWidth: 1,
        borderRightColor: "#38bdf8",
        backgroundColor: "#0ea5e9",
        alignItems: "center",
        justifyContent: "center",
    },
    matrixHeaderCell: {
        width: 90,
        padding: 0,
        borderRightWidth: 1,
        borderRightColor: "#38bdf8",
        backgroundColor: "transparent", // 🔥 no parent background
    },
    headerText: {
        color: "white",
        fontWeight: "600",
    },
    matrixHeader: {
        width: "100%",
        alignItems: "center",
    },
    snfHeader: {
        width: "100%",
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: 4,
        backgroundColor: "#0ea5e9", // darker blue
        paddingVertical: 6,
    },
    fatHeader: {
        width: "100%",
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: 4,
        backgroundColor: "#0369a1", // slightly different shade
        paddingVertical: 6,
    },
    firstColumn: {
        backgroundColor: "#0369a1",
        color: "white"
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
        width: 90,
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
    editedCell: {
        width: 90,
        // padding: 14,
        fontSize: 14,
        textAlign: "center",
        borderWidth: 2,
        borderColor: "#dd0a0aff",
    },
    actionCell: {
        width: 90,
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
