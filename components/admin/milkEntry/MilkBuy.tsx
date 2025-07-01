import UserModal from "@/components/common/UserModal"
import { api } from "@/constants/api"
import { defaultRateChart } from "@/constants/rateData"
import useCustomers from "@/hooks/useCustomer"
import { calculateTotal, fetchTodayEntries, handleDeleteEntry } from "@/utils/helper"
import { Feather, FontAwesome } from "@expo/vector-icons"
import DateTimePicker from "@react-native-community/datetimepicker"
import { format } from "date-fns"
import { LinearGradient } from "expo-linear-gradient"
import { useFocusEffect } from "expo-router"
import { useCallback, useEffect, useRef, useState } from "react"
import {
    Alert,
    Dimensions,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native"
import ListShow from "./ListShow"

const { width: screenWidth } = Dimensions.get("window")

interface User {
    _id: string
    id: string
    name: string
    mobile: string
    collectionCenter: string
    profilePic: string
}

interface FormData {
    userId: string
    weight: string
    fat: string
    snf: string
    rate: string
    date: string
    shift: "Morning" | "Evening"
    milkType: "Cow" | "Buffalo"
}

interface MilkEntry {
    _id: string
    byUser: {
        _id: string;
        name: string;
        profilePic?: string;
    };
    // userId: string
    weight: number
    fat: number
    snf: number
    rate: number
    price: number
    date: string
    shift: "Morning" | "Evening"
    milkType: "Cow" | "Buffalo"
}

interface RateChartRow {
    fat: number
    snf8_0: number
    snf8_1: number
    snf8_2: number
    snf8_3: number
    snf8_4: number
    snf8_5: number
}

export default function MilkBuyEntry() {
    const [rateChart] = useState<RateChartRow[]>(defaultRateChart)
    const [showUserSelector, setShowUserSelector] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [selectedUser, setSelectedUser] = useState<User | null>(null)
    const [showDatePicker, setShowDatePicker] = useState(false)
    const [todayEntries, setTodayEntries] = useState<MilkEntry[]>([])
    const [isLoadingEntries, setIsLoadingEntries] = useState(false)
    const [showOptionsModal, setShowOptionsModal] = useState(false)
    const [selectedEntry, setSelectedEntry] = useState<MilkEntry | null>(null)
    const [editingEntry, setEditingEntry] = useState<MilkEntry | null>(null)
    const { customers, token } = useCustomers({ role: "Farmer" })
    const weightRef = useRef<TextInput>(null);
    const fatRef = useRef<TextInput>(null);
    const snfRef = useRef<TextInput>(null);

    const [formData, setFormData] = useState<FormData>({
        userId: "",
        weight: "",
        fat: "",
        snf: "",
        rate: "",
        date: format(new Date(), "yyyy-MM-dd"),
        shift: new Date().getHours() < 12 ? "Morning" : "Evening",
        milkType: "Cow",
    })

    // Helper function to update form data
    const updateFormData = (field: string, value: string) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }))
    }

    // Function to get rate from chart based on fat and SNF
    const getRateFromChart = (fatValue: number, snfValue: number): number => {
        const fatRow = rateChart.find((row) => Math.abs(row.fat - fatValue) < 0.05)
        if (!fatRow) return 0
        if (snfValue >= 8.0 && snfValue < 8.05) return fatRow.snf8_0
        if (snfValue >= 8.05 && snfValue < 8.15) return fatRow.snf8_1
        if (snfValue >= 8.15 && snfValue < 8.25) return fatRow.snf8_2
        if (snfValue >= 8.25 && snfValue < 8.35) return fatRow.snf8_3
        if (snfValue >= 8.35 && snfValue < 8.45) return fatRow.snf8_4
        if (snfValue >= 8.45 && snfValue <= 8.5) return fatRow.snf8_5

        return 0
    }

    // Auto-calculate rate when fat or SNF changes
    useEffect(() => {
        if (formData.fat && formData.snf) {
            const fatNum = Number.parseFloat(formData.fat)
            const snfNum = Number.parseFloat(formData.snf)

            if (!isNaN(fatNum) && !isNaN(snfNum)) {
                const rate = getRateFromChart(fatNum, snfNum)
                if (rate > 0) {
                    updateFormData("rate", rate.toFixed(2))
                }
            }
        }
    }, [formData.fat, formData.snf, rateChart])



    // Load entries when date or shift changes
    useEffect(() => {
        if (token) {
            fetchTodayEntries(api.getRecords, setIsLoadingEntries, formData.date, formData.shift, setTodayEntries)
        }
    }, [formData.date, formData.shift, token])

    useFocusEffect(
        useCallback(() => {
            resetForm();
            fetchTodayEntries(api.getRecords, setIsLoadingEntries, formData.date, formData.shift, setTodayEntries);
        }, [])
    );

    // Handle date picker change
    const onDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(false)
        if (selectedDate) {
            const dateString = format(selectedDate, "yyyy-MM-dd")
            updateFormData("date", dateString)
        }
    }

    // Reset form
    const resetForm = () => {
        setFormData({
            userId: "",
            weight: "",
            fat: "",
            snf: "",
            rate: "",
            date: format(new Date(), "yyyy-MM-dd"),
            shift: new Date().getHours() < 12 ? "Morning" : "Evening",
            milkType: "Cow",
        })
        setSelectedUser(null)
        setEditingEntry(null)
    }

    // Handle submit
    const handleSubmit = async () => {
        if (!formData.userId) {
            Alert.alert("Error", "Please select a user")
            return
        }

        if (!formData.weight || !formData.fat || !formData.snf || !formData.rate) {
            Alert.alert("Error", "Please fill in all required fields")
            return
        }

        setIsSubmitting(true)

        try {
            const entryData = {
                userId: formData.userId,
                date: formData.date,
                shift: formData.shift,
                weight: formData.weight,
                fat: formData.fat,
                snf: formData.snf,
                rate: formData.rate,
                price: calculateTotal(formData.weight, formData.rate),
                milkType: formData.milkType,
            }

            const url = editingEntry ? `${api.milkEntry}/${editingEntry._id}` : api.milkEntry
            const method = editingEntry ? "PUT" : "POST"

            const response = await fetch(url, {
                method,
                body: JSON.stringify(entryData),
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            })

            const data = await response.json()

            if (data.success) {
                Alert.alert("Success", data.message)
                resetForm()
                fetchTodayEntries(api.getRecords, setIsLoadingEntries, formData.date, formData.shift, setTodayEntries)
            } else {
                Alert.alert("Error", data.message)
            }
        } catch (error) {
            console.error("Submit Error:", error)
            Alert.alert("Error", "Failed to add milk entry")
        } finally {
            setIsSubmitting(false)
        }
    }

    // Handle edit entry
    const handleEditEntry = (entry: MilkEntry) => {
        setEditingEntry(entry)
        const user = customers.find((c) => c._id === entry.byUser._id)
        setSelectedUser(user || null)
        setFormData({
            userId: entry.byUser._id,
            weight: entry.weight.toString(),
            fat: entry.fat.toString(),
            snf: entry.snf.toString(),
            rate: entry.rate.toString(),
            date: entry.date,
            shift: entry.shift,
            milkType: entry.milkType,
        })
        setShowOptionsModal(false)
    }

    const existingUserIds: string[] = Array.isArray(todayEntries) && todayEntries.length > 0
        ? todayEntries.map(entry => entry?.byUser?._id)
        : [];
    const filteredUser = customers.filter(customer => !existingUserIds.includes(customer._id))

    // Render entry options modal
    const renderEntryOptionsModal = () => (
        <Modal visible={showOptionsModal} animationType="fade" transparent>
            <View style={styles.modalOverlay}>
                <View style={styles.optionsModalContent}>
                    <Text style={styles.optionsModalTitle}>Entry Options</Text>
                    <TouchableOpacity style={styles.optionButton} onPress={() => selectedEntry && handleEditEntry(selectedEntry)}>
                        <View style={styles.optionIconContainer}>
                            <Feather name="edit" size={20} color="#0ea5e9" />
                        </View>
                        <Text style={styles.optionButtonText}>Edit Entry</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.optionButton, styles.deleteOptionButton]}
                        onPress={() => {
                            setShowOptionsModal(false)
                            selectedEntry && handleDeleteEntry(
                                selectedEntry._id,
                                () => fetchTodayEntries(api.getRecords, setIsLoadingEntries, formData.date, formData.shift, setTodayEntries),
                                token
                            )
                        }}
                    >
                        <View style={[styles.optionIconContainer, styles.deleteIconContainer]}>
                            <Feather name="trash-2" size={20} color="#ef4444" />
                        </View>
                        <Text style={[styles.optionButtonText, styles.deleteOptionText]}>Delete Entry</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.cancelButton} onPress={() => setShowOptionsModal(false)}>
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    )

    return (
        <>
            {/* Compact Form Section */}
            <View style={styles.formSection}>
                <LinearGradient colors={["#f0f9ff", "#e0f2fe"]} style={styles.formCard}>
                    {editingEntry && (
                        <View style={styles.editingBanner}>
                            <Feather name="edit" size={14} color="#0ea5e9" />
                            <Text style={styles.editingBannerText}>Editing: {selectedUser?.name}</Text>
                            <TouchableOpacity onPress={resetForm}>
                                <Feather name="x" size={14} color="#64748b" />
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Date, Shift and Milk Type in one row */}
                    <View style={styles.topRow}>
                        <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.compactField}>
                            <FontAwesome name="calendar" size={14} color="#0284c7" />
                            <Text style={styles.compactFieldText}>{format(new Date(formData.date), "dd/MM")}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.compactField}
                            onPress={() => {
                                const newShift = formData.shift === "Morning" ? "Evening" : "Morning"
                                updateFormData("shift", newShift)
                            }}
                        >
                            <Text style={styles.compactFieldText}>
                                {formData.shift === "Morning" ? "🌅" : "🌙"} {formData.shift}
                            </Text>
                        </TouchableOpacity>

                        <View style={styles.milkTypeToggle}>
                            <TouchableOpacity
                                style={[styles.milkTypeBtn, formData.milkType === "Cow" && styles.milkTypeBtnActive]}
                                onPress={() => updateFormData("milkType", "Cow")}
                            >
                                <Text style={styles.milkTypeText}>🐄</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.milkTypeBtn, formData.milkType === "Buffalo" && styles.milkTypeBtnActive]}
                                onPress={() => updateFormData("milkType", "Buffalo")}
                            >
                                <Text style={styles.milkTypeText}>🐃</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* User Selector */}
                    <TouchableOpacity style={styles.userSelector} onPress={() => setShowUserSelector(true)}>
                        <FontAwesome name="user" size={16} color="#0ea5e9" />
                        <Text style={styles.userSelectorText}>{selectedUser ? selectedUser.name : "Select Farmer"}</Text>
                        <Feather name="chevron-down" size={16} color="#64748b" />
                    </TouchableOpacity>

                    {/* Input fields in two rows */}
                    <View style={styles.inputRow}>
                        <View style={styles.inputContainer}>
                            <FontAwesome name="balance-scale" size={16} color="#38bdf8" />
                            <TextInput
                                ref={weightRef}
                                style={styles.input}
                                placeholder="Weight"
                                placeholderTextColor="#93c5fd"
                                value={formData.weight}
                                onChangeText={(value) => updateFormData("weight", value)}
                                keyboardType="decimal-pad"
                                returnKeyType="next"
                                onSubmitEditing={() => fatRef.current?.focus()}
                            />
                            <Text style={styles.inputUnit}>L</Text>
                        </View>

                        <View style={styles.inputContainer}>
                            <FontAwesome name="percent" size={16} color="#f59e0b" />
                            <TextInput
                                ref={fatRef}
                                style={styles.input}
                                placeholder="Fat"
                                placeholderTextColor="#93c5fd"
                                value={formData.fat}
                                onChangeText={(value) => updateFormData("fat", value)}
                                keyboardType="decimal-pad"
                                onSubmitEditing={() => snfRef.current?.focus()}
                            />
                            <Text style={styles.inputUnit}>%</Text>
                        </View>
                    </View>

                    <View style={styles.inputRow}>
                        <View style={styles.inputContainer}>
                            <FontAwesome name="percent" size={16} color="#8b5cf6" />
                            <TextInput
                                ref={snfRef}
                                style={styles.input}
                                placeholder="SNF"
                                placeholderTextColor="#93c5fd"
                                value={formData.snf}
                                onChangeText={(value) => updateFormData("snf", value)}
                                keyboardType="decimal-pad"
                                onSubmitEditing={() => {
                                    /* all fields filled—either calculate rate or move to submit */
                                    // e.g.:
                                    handleSubmit();
                                }}
                            />
                            <Text style={styles.inputUnit}>%</Text>
                        </View>

                        <View style={styles.rateDisplay}>
                            <FontAwesome name="rupee" size={16} color="#10b981" />
                            <Text style={styles.rateText}>₹{formData.rate || "0.00"}</Text>
                        </View>
                    </View>

                    {/* Total and Submit */}
                    <View style={styles.bottomRow}>
                        <View style={styles.totalDisplay}>
                            <Text style={styles.totalLabel}>Total: </Text>
                            <Text style={styles.totalValue}>₹{calculateTotal(formData.weight, formData.rate)}</Text>
                        </View>

                        <TouchableOpacity
                            style={styles.submitButton}
                            disabled={isSubmitting || !selectedUser}
                            onPress={handleSubmit}
                        >
                            <LinearGradient colors={["#0ea5e9", "#0284c7"]} style={styles.submitGradient}>
                                <FontAwesome name={editingEntry ? "save" : "plus"} size={16} color="white" />
                                <Text style={styles.submitButtonText}>{isSubmitting ? "..." : editingEntry ? "Update" : "Add"}</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>

                    {/* Date Picker Modal */}
                    {showDatePicker && (
                        <DateTimePicker
                            value={new Date(formData.date)}
                            mode="date"
                            display="default"
                            onChange={onDateChange}
                            maximumDate={new Date()}
                        />
                    )}
                </LinearGradient>
            </View>

            {/* Entries List Section */}
            <ListShow
                text="Collection"
                url={api.getRecords}
                todayEntries={todayEntries}
                setTodayEntries={setTodayEntries}
                fetchTodayEntries={fetchTodayEntries}
                shift={formData.shift}
                date={formData.date}
                isLoadingEntries={isLoadingEntries}
                setIsLoadingEntries={setIsLoadingEntries}
            />

            {<UserModal showUserSelector={showUserSelector} setShowUserSelector={setShowUserSelector} filteredUser={filteredUser} selectedUser={selectedUser} setSelectedUser={setSelectedUser} updateFormData={updateFormData} weightRef={weightRef} />}
            {renderEntryOptionsModal()}
        </>
    )
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f8fafc",
    },
    formSection: {
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    formCard: {
        borderRadius: 16,
        padding: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    editingBanner: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#dbeafe",
        padding: 8,
        borderRadius: 8,
        marginBottom: 12,
    },
    editingBannerText: {
        flex: 1,
        marginLeft: 6,
        color: "#0ea5e9",
        fontWeight: "600",
        fontSize: 12,
    },
    topRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
        gap: 8,
    },
    compactField: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(255, 255, 255, 0.8)",
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#bae6fd",
        gap: 6,
    },
    compactFieldText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#0c4a6e",
    },
    milkTypeToggle: {
        flexDirection: "row",
        backgroundColor: "white",
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#e2e8f0",
        overflow: "hidden",
        marginLeft: "auto",
    },
    milkTypeBtn: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: "white",
    },
    milkTypeBtnActive: {
        backgroundColor: "#f0f9ff",
    },
    milkTypeText: {
        fontSize: 16,
    },
    userSelector: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "white",
        borderWidth: 1,
        borderColor: "#0ea5e9",
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 12,
        gap: 8,
    },
    userSelectorText: {
        flex: 1,
        fontSize: 14,
        color: "#0c4a6e",
        fontWeight: "500",
    },
    inputRow: {
        flexDirection: "row",
        gap: 8,
        marginBottom: 8,
    },
    inputContainer: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "white",
        borderWidth: 1,
        borderColor: "#bae6fd",
        borderRadius: 10,
        paddingHorizontal: 12,
        height: 44,
        gap: 8,
    },
    input: {
        flex: 1,
        fontSize: 14,
        color: "#0c4a6e",
    },
    inputUnit: {
        fontSize: 12,
        color: "#64748b",
        fontWeight: "500",
    },
    rateDisplay: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#ecfdf5",
        borderWidth: 1,
        borderColor: "#86efac",
        borderRadius: 10,
        paddingHorizontal: 12,
        height: 44,
        gap: 8,
    },
    rateText: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#047857",
    },
    bottomRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: 8,
    },
    totalDisplay: {
        flexDirection: "row",
        alignItems: "center",
    },
    totalLabel: {
        fontSize: 14,
        color: "#059669",
        fontWeight: "500",
    },
    totalValue: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#047857",
    },
    submitButton: {
        borderRadius: 10,
        overflow: "hidden",
    },
    submitGradient: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 10,
        paddingHorizontal: 16,
        gap: 6,
    },
    submitButtonText: {
        color: "white",
        fontSize: 14,
        fontWeight: "bold",
    },
    profilePic: {
        width: 36,
        height: 36,
        borderRadius: 18,
        marginRight: 8,
        borderWidth: 1,
        borderColor: "#e2e8f0",
    },
    entryUserInfo: {
        flex: 1,
    },
    entryUserROw: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 4,
    },
    entryUserName: {
        fontSize: 13,
        fontWeight: "600",
        color: "#0c4a6e",
        marginBottom: 4,
    },
    entryBadges: {
        flexDirection: "row",
        gap: 4,
    },
    milkTypeBadge: {
        backgroundColor: "#f0f9ff",
        paddingHorizontal: 4,
        paddingVertical: 1,
        borderRadius: 4,
    },
    milkTypeBadgeText: {
        fontSize: 9,
        color: "#0ea5e9",
        fontWeight: "500",
    },
    shiftBadge: {
        paddingHorizontal: 4,
        paddingVertical: 1,
        borderRadius: 4,
    },
    morningShift: {
        backgroundColor: "#fef3c7",
    },
    eveningShift: {
        backgroundColor: "#e0e7ff",
    },
    shiftBadgeText: {
        fontSize: 9,
        fontWeight: "500",
    },
    morningShiftText: {
        color: "#f59e0b",
    },
    eveningShiftText: {
        color: "#6366f1",
    },
    optionsButton: {
        padding: 2,
    },
    entryDetailsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 4,
        marginBottom: 8,
    },
    entryDetailCard: {
        backgroundColor: "#f8fafc",
        padding: 6,
        borderRadius: 4,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#e2e8f0",
        width: "48%",
    },
    entryDetailCardLabel: {
        fontSize: 8,
        color: "#64748b",
        marginTop: 2,
    },
    entryDetailCardValue: {
        fontSize: 11,
        fontWeight: "600",
        color: "#334155",
        marginTop: 1,
    },
    entryFooter: {
        borderTopWidth: 1,
        borderTopColor: "#f1f5f9",
        paddingTop: 8,
    },
    totalAmountContainer: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        gap: 4,
    },
    totalAmountLabel: {
        fontSize: 10,
        fontWeight: "500",
    },
    entryAmount: {
        fontSize: 12,
        fontWeight: "bold",
        color: "#059669",
    },

    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "center",
        alignItems: "center",
    },
    modalContent: {
        backgroundColor: "white",
        borderRadius: 20,
        padding: 0,
        margin: 20,
        width: "90%",
        maxHeight: "80%",
        overflow: "hidden",
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: "#f1f5f9",
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#0c4a6e",
    },
    userOption: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: "#f1f5f9",
    },
    userOptionSelected: {
        backgroundColor: "#f0f9ff",
    },
    userOptionContent: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
    },
    userOptionContentColumn: {
        flex: 1
    },
    userOptionName: {
        fontSize: 16,
        fontWeight: "600",
        color: "#334155",
    },
    userOptionDetails: {
        fontSize: 14,
        color: "#64748b",
        marginTop: 2,
    },
    selectedIndicator: {
        backgroundColor: "#0ea5e9",
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
    },
    optionsModalContent: {
        backgroundColor: "white",
        borderRadius: 16,
        padding: 20,
        margin: 20,
        width: "80%",
    },
    optionsModalTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#0c4a6e",
        marginBottom: 20,
        textAlign: "center",
    },
    optionButton: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderRadius: 12,
        marginBottom: 8,
        backgroundColor: "#f8fafc",
    },
    deleteOptionButton: {
        backgroundColor: "#fef2f2",
    },
    optionIconContainer: {
        backgroundColor: "#f0f9ff",
        padding: 8,
        borderRadius: 8,
    },
    deleteIconContainer: {
        backgroundColor: "#fee2e2",
    },
    optionButtonText: {
        fontSize: 16,
        fontWeight: "500",
        color: "#0ea5e9",
        marginLeft: 12,
    },
    deleteOptionText: {
        color: "#ef4444",
    },
    cancelButton: {
        paddingVertical: 12,
        alignItems: "center",
        marginTop: 8,
    },
    cancelButtonText: {
        fontSize: 16,
        color: "#64748b",
        fontWeight: "500",
    },
})