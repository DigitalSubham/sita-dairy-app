import React, { useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

type RateChartRow = {
    fat: number;
    snf8_0: number;
    snf8_1: number;
    snf8_2: number;
    snf8_3: number;
    snf8_4: number;
    snf8_5: number;
};
type EditingCell = { row: number; col: string } | null;

type RenderRateChartProps = {
    rateChart: RateChartRow[];
    editingCell: { row: number; col: string } | null;
    setEditingCell: React.Dispatch<React.SetStateAction<EditingCell>>;

    handleCellEdit: (rowIndex: number, column: keyof RateChartRow, value: string) => void;
};

type RenderEditableCellProps = {
    value: number;
    rowIndex: number;
    column: keyof RateChartRow;
    editingCell: { row: number; col: string } | null;
    setEditingCell: React.Dispatch<React.SetStateAction<EditingCell>>;
    handleCellEdit: (rowIndex: number, column: keyof RateChartRow, value: string) => void;
};

const RenderEditableCell: React.FC<RenderEditableCellProps> = ({
    value,
    rowIndex,
    column,
    editingCell,
    setEditingCell,
    handleCellEdit,
}) => {
    const [text, setText] = useState("")
    const isEditing = editingCell?.row === rowIndex && editingCell?.col === column;

    if (isEditing) {
        return (
            <TextInput
                style={styles.cellInput}
                value={text}
                onChangeText={setText}
                onBlur={() => {
                    // only parse & save when the user leaves the field
                    handleCellEdit(rowIndex, column, text);
                    setEditingCell(null);
                }}
                keyboardType="decimal-pad"
                autoFocus
                selectTextOnFocus
            />
        );
    }

    return (
        <TouchableOpacity
            style={styles.cellTouchable}
            onPress={() => setEditingCell({ row: rowIndex, col: column })}
        >
            <Text style={styles.cellText}>{value.toFixed(2)}</Text>
        </TouchableOpacity>
    );
};



const RenderRateChart: React.FC<RenderRateChartProps> = ({
    rateChart,
    handleCellEdit,
    editingCell,
    setEditingCell,
}) => (
    <View style={styles.container}>
        {/* <RateChartHeader /> */}

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chartTable}>
                <View style={styles.chartHeaderRow}>
                    <Text style={styles.chartHeaderCell}>Fat %</Text>
                    <Text style={styles.chartHeaderCell}>8.0</Text>
                    <Text style={styles.chartHeaderCell}>8.1</Text>
                    <Text style={styles.chartHeaderCell}>8.2</Text>
                    <Text style={styles.chartHeaderCell}>8.3</Text>
                    <Text style={styles.chartHeaderCell}>8.4</Text>
                    <Text style={styles.chartHeaderCell}>8.5</Text>
                    <Text style={styles.chartHeaderCell}>Action</Text>
                </View>


                <ScrollView
                    style={styles.chartScrollWrapper}
                    contentContainerStyle={{ flexGrow: 1 }}
                >
                    {rateChart.map((row, index) => (
                        <View key={index} style={styles.chartRow}>
                            {(Object.keys(row) as (keyof RateChartRow)[]).map((column) => (
                                <RenderEditableCell
                                    key={column}
                                    value={row[column]}
                                    rowIndex={index}
                                    column={column}
                                    editingCell={editingCell}
                                    setEditingCell={setEditingCell}
                                    handleCellEdit={handleCellEdit}
                                />
                            ))}
                        </View>
                    ))}
                </ScrollView>
            </View>
        </ScrollView>

        <View style={styles.chartInstructions}>
            <Text style={styles.instructionText}>
                💡 Tap any cell to edit rates. The app will automatically calculate
                rates based on Fat % and SNF % values.
            </Text>
        </View>
    </View>
);

export default RenderRateChart;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f8fafc",
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
    chartScrollWrapper: {
        flex: 1,
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
    chartInstructions: {
        backgroundColor: "#fef3c7",
        padding: 16,
        borderRadius: 12,
        marginTop: 20,
        borderWidth: 1,
        borderColor: "#fbbf24",
    },
    instructionText: {
        color: "#92400e",
        fontSize: 14,
        textAlign: "center",
    },
});
