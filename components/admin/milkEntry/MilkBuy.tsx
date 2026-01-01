import UserModal from "@/components/common/UserModal";
import EntryForm from "@/components/forms/EntryForm";
import { api } from "@/constants/api";
import { defaultRateChart } from "@/constants/rateData";
import {
    MilkEntry,
    MilkEntryFormData,
    MilkType,
    RateChartRow,
    ShiftType,
    User,
} from "@/constants/types";
import useCustomers from "@/hooks/useCustomer";
import {
    calculateTotal,
    fetchTodayEntries
} from "@/utils/helper";
import { format } from "date-fns";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Alert,
    StyleSheet,
    TextInput
} from "react-native";
import ListShow from "./ListShow";

export default function MilkBuyEntry() {
    const [rateChart] = useState<RateChartRow[]>(defaultRateChart);
    const [showUserSelector, setShowUserSelector] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [todayEntries, setTodayEntries] = useState<MilkEntry[]>([]);
    const [isLoadingEntries, setIsLoadingEntries] = useState(false);
    const [editingEntry, setEditingEntry] = useState<MilkEntry | null>(null);
    const { customers, token } = useCustomers({ role: "Farmer" });
    const weightRef = useRef<TextInput>(null);

    const { t } = useTranslation();
    const [formData, setFormData] = useState<MilkEntryFormData>({
        userId: "",
        weight: "",
        fat: "",
        snf: "",
        rate: "",
        date: format(new Date(), "yyyy-MM-dd"),
        shift: new Date().getHours() < 12 ? ShiftType.Morning : ShiftType.Evening,
        milkType: MilkType.Cow,
    });

    // Helper function to update form data
    const updateFormData = (field: string, value: string) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    // Function to get rate from chart based on fat and SNF
    const getRateFromChart = (fatValue: number, snfValue: number): number => {
        const fatRow = rateChart.find((row) => Math.abs(row.fat - fatValue) < 0.05);
        if (!fatRow) return 0;
        if (snfValue >= 8.00 && snfValue < 8.05) return fatRow.snf8_0;
        if (snfValue >= 8.05 && snfValue < 8.15) return fatRow.snf8_1;
        if (snfValue >= 8.15 && snfValue < 8.25) return fatRow.snf8_2;
        if (snfValue >= 8.25 && snfValue < 8.35) return fatRow.snf8_3;
        if (snfValue >= 8.35 && snfValue < 8.45) return fatRow.snf8_4;
        if (snfValue >= 8.45 && snfValue <= 8.5) return fatRow.snf8_5;

        return 0;
    };

    // Auto-calculate rate when fat or SNF changes
    useEffect(() => {
        if (formData.fat && formData.snf) {
            const fatNum = Number.parseFloat(formData.fat);
            const snfNum = Number.parseFloat(formData.snf);

            if (!isNaN(fatNum) && !isNaN(snfNum)) {
                const rate = getRateFromChart(fatNum, snfNum);
                if (rate > 0) {
                    updateFormData("rate", rate.toFixed(2));
                }
            }
        }
    }, [formData.fat, formData.snf, rateChart]);

    // Load entries when date or shift changes
    useEffect(() => {
        if (token) {
            fetchTodayEntries(
                api.getRecords,
                setIsLoadingEntries,
                formData.date,
                formData.shift,
                setTodayEntries
            );
        }
    }, [formData.date, formData.shift, token]);

    useFocusEffect(
        useCallback(() => {
            resetForm();
            fetchTodayEntries(
                api.getRecords,
                setIsLoadingEntries,
                formData.date,
                formData.shift,
                setTodayEntries
            );
        }, [])
    );


    // Reset form
    const resetForm = () => {
        setFormData({
            userId: "",
            weight: "",
            fat: "",
            snf: "",
            rate: "",
            date: format(new Date(), "yyyy-MM-dd"),
            shift: new Date().getHours() < 12 ? ShiftType.Morning : ShiftType.Evening,
            milkType: MilkType.Cow,
        });
        setSelectedUser(null);
        setEditingEntry(null);
    };

    // Handle submit
    const handleSubmit = async () => {
        if (!formData.userId) {
            Alert.alert("Error", "Please select a user");
            return;
        }

        if (!formData.weight || !formData.fat || !formData.snf || !formData.rate) {
            Alert.alert("Error", "Please fill in all required fields");
            return;
        }

        setIsSubmitting(true);

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
            };

            const url = editingEntry
                ? `${api.milkEntry}/${editingEntry._id}`
                : api.milkEntry;
            const method = editingEntry ? "PUT" : "POST";

            const response = await fetch(url, {
                method,
                body: JSON.stringify(entryData),
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if (data.success) {
                Alert.alert("Success", data.message);
                resetForm();
                fetchTodayEntries(
                    api.getRecords,
                    setIsLoadingEntries,
                    formData.date,
                    formData.shift,
                    setTodayEntries
                );
            } else {
                Alert.alert("Error", data.message);
            }
        } catch (error) {
            console.error("Submit Error:", error);
            Alert.alert("Error", "Failed to add milk entry");
        } finally {
            setIsSubmitting(false);
        }
    };

    const existingUserIds: string[] =
        Array.isArray(todayEntries) && todayEntries.length > 0
            ? todayEntries.map((entry) => entry?.byUser?._id)
            : [];

    const filteredUser = customers
        .filter((c) => !existingUserIds.includes(c._id))
        .sort((a, b) => {
            if (a.positionNo === undefined && b.positionNo === undefined) return 0;
            if (a.positionNo === undefined) return 1; // move undefined to end
            if (b.positionNo === undefined) return -1;
            return a.positionNo - b.positionNo;
        });



    return (
        <>
            {/* Compact Form Section */}
            <EntryForm
                editingEntry={editingEntry}
                formData={formData}
                selectedUser={selectedUser}
                updateFormData={updateFormData}
                setShowUserSelector={setShowUserSelector}
                weightRef={weightRef}
                handleSubmit={handleSubmit}
                isSubmitting={isSubmitting}
            />

            {/* Entries List Section */}
            <ListShow
                text={t("entry.today_buy")}
                url={api.getRecords}
                todayEntries={todayEntries}
                setTodayEntries={setTodayEntries}
                fetchTodayEntries={fetchTodayEntries}
                shift={
                    formData.shift === "Morning" ? t("entry.morning") : t("entry.evening")
                }
                date={formData.date}
                isLoadingEntries={isLoadingEntries}
                setIsLoadingEntries={setIsLoadingEntries}
            />


            <UserModal
                title={t("entry.buyer")}
                showUserSelector={showUserSelector}
                setShowUserSelector={setShowUserSelector}
                filteredUser={filteredUser}
                selectedUser={selectedUser}
                setSelectedUser={setSelectedUser}
                updateFormData={updateFormData}
                weightRef={weightRef}
            />

        </>
    );
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
        flex: 1,
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
});
