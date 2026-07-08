import ModalWrapper from "@/components/common/ModalWrapper";
import UserModal from "@/components/common/UserModal";
import EntryForm from "@/components/forms/EntryForm";
import { api } from "@/constants/api";
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
import AsyncStorage from "@react-native-async-storage/async-storage";
import { format } from "date-fns";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Alert,
    TextInput
} from "react-native";
import ListShow from "./ListShow";

type MilkBuyEntryProps = {
    onWalletAmountChange?: (amount: number | null) => void;
};

export default function MilkBuyEntry({ onWalletAmountChange }: MilkBuyEntryProps = {}) {
    const [rateChart, setRateChart] = useState<RateChartRow[]>();
    const [showUserSelector, setShowUserSelector] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [todayEntries, setTodayEntries] = useState<MilkEntry[]>([]);
    const [isLoadingEntries, setIsLoadingEntries] = useState(false);
    const [editingEntry, setEditingEntry] = useState<MilkEntry | null>(null);
    const { customers, token, refresh: refreshCustomers } = useCustomers({ role: "Farmer", activeOnly: true });
    const weightRef = useRef<TextInput>(null);
    const { t } = useTranslation();

    // Editing an existing entry from today's entries list (separate modal, distinct from the create form above)
    const [editingListEntry, setEditingListEntry] = useState<MilkEntry | null>(null);
    const [editSelectedUser, setEditSelectedUser] = useState<User | null>(null);
    const [showEditUserSelector, setShowEditUserSelector] = useState(false);
    const [isUpdatingListEntry, setIsUpdatingListEntry] = useState(false);
    const editWeightRef = useRef<TextInput>(null);
    const [editFormData, setEditFormData] = useState<MilkEntryFormData>({
        userId: "",
        weight: "",
        fat: "",
        snf: "",
        rate: "",
        date: format(new Date(), "yyyy-MM-dd"),
        shift: ShiftType.Morning,
        milkType: MilkType.Cow,
    });
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
        const fatRow = rateChart?.find((row) => Math.abs(row.fat - fatValue) < 0.05);
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

    // Fetch and report the selected farmer's wallet amount to the parent header
    useEffect(() => {
        if (!selectedUser?._id || !token) {
            onWalletAmountChange?.(null);
            return;
        }
        let isCancelled = false;
        (async () => {
            try {
                const response = await fetch(`${api.getUser}?userId=${selectedUser._id}`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                });
                const data = await response.json();
                if (!isCancelled && data.success) {
                    onWalletAmountChange?.(data.user?.walletAmount ?? null);
                }
            } catch (error) {
                console.error("Error fetching wallet amount:", error);
            }
        })();
        return () => {
            isCancelled = true;
        };
    }, [selectedUser?._id, token]);

    const fetchDataFromServer = async () => {
        const token = await AsyncStorage.getItem("token");
        const parsedToken = token ? JSON.parse(token) : null;
        try {
            // setLoading(true)

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
            } else {
                Alert.alert(t("common.error"), data.message || t("records.failed_fetch_entries"))
            }

        } catch (error) {
            Alert.alert(t("common.error"), t("records.failed_fetch_entries"))
            console.error("Fetch error:", error)
        } finally {
            // setLoading(false)
        }
    }

    // Load entries when date or shift changes
    useEffect(() => {
        if (token) {
            fetchDataFromServer()
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
            fetchDataFromServer()
            fetchTodayEntries(
                api.getRecords,
                setIsLoadingEntries,
                formData.date,
                formData.shift,
                setTodayEntries
            );
            refreshCustomers();
        }, [refreshCustomers])
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
            Alert.alert(t("common.error"), t("validation.user"));
            return;
        }

        if (!formData.weight || !formData.fat || !formData.snf || !formData.rate) {
            Alert.alert(t("common.error"), t("validation.all_fields_required"));
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
                Alert.alert(t("common.success"), data.message);
                resetForm();
                fetchTodayEntries(
                    api.getRecords,
                    setIsLoadingEntries,
                    formData.date,
                    formData.shift,
                    setTodayEntries
                );
            } else {
                Alert.alert(t("common.error"), data.message);
            }
        } catch (error) {
            console.error("Submit Error:", error);
            Alert.alert(t("common.error"), t("records.failed_update_entry"));
        } finally {
            setIsSubmitting(false);
        }
    };

    // Helper function to update the today's-entry edit form data
    const updateEditFormData = (field: string, value: string) => {
        setEditFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    // Auto-calculate rate when fat or SNF changes in the edit modal
    useEffect(() => {
        if (editFormData.fat && editFormData.snf) {
            const fatNum = Number.parseFloat(editFormData.fat);
            const snfNum = Number.parseFloat(editFormData.snf);

            if (!isNaN(fatNum) && !isNaN(snfNum)) {
                const rate = getRateFromChart(fatNum, snfNum);
                if (rate > 0) {
                    updateEditFormData("rate", rate.toFixed(2));
                }
            }
        }
    }, [editFormData.fat, editFormData.snf, rateChart]);

    // Open the edit modal for an entry from today's entries list
    const handleEditListEntry = (entry: MilkEntry) => {
        setEditingListEntry(entry);
        setEditSelectedUser(customers.find((c) => c._id === entry.byUser._id) ?? null);
        setEditFormData({
            userId: entry.byUser._id,
            weight: String(entry.weight ?? ""),
            fat: String(entry.fat ?? ""),
            snf: String(entry.snf ?? ""),
            rate: String(entry.rate ?? ""),
            date: entry.date,
            shift: entry.shift,
            milkType: entry.milkType,
        });
    };

    // Submit the today's-entry edit
    const handleUpdateListEntry = async () => {
        if (!editingListEntry) return;

        if (!editFormData.weight || !editFormData.fat || !editFormData.snf || !editFormData.rate) {
            Alert.alert(t("common.error"), t("validation.all_fields_required"));
            return;
        }

        setIsUpdatingListEntry(true);

        try {
            const entryData = {
                userId: editFormData.userId,
                date: editFormData.date,
                shift: editFormData.shift,
                weight: editFormData.weight,
                fat: editFormData.fat,
                snf: editFormData.snf,
                rate: editFormData.rate,
                price: calculateTotal(editFormData.weight, editFormData.rate),
                milkType: editFormData.milkType,
            };

            const response = await fetch(`${api.updateMilkEntry}/${editingListEntry._id}`, {
                method: "PUT",
                body: JSON.stringify(entryData),
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if (data.success) {
                Alert.alert(t("common.success"), data.message);
                setEditingListEntry(null);
                fetchTodayEntries(
                    api.getRecords,
                    setIsLoadingEntries,
                    formData.date,
                    formData.shift,
                    setTodayEntries
                );
            } else {
                Alert.alert(t("common.error"), data.message);
            }
        } catch (error) {
            console.error("Update Error:", error);
            Alert.alert(t("common.error"), t("records.failed_update_entry"));
        } finally {
            setIsUpdatingListEntry(false);
        }
    };

    // Confirm and delete an entry from today's entries list
    const handleDeleteListEntry = (entry: MilkEntry) => {
        Alert.alert(
            t("common.delete_item_title", { item: t("records.entry") }),
            t("common.delete_item_confirmation", { item: t("records.entry") }),
            [
                { text: t("common.cancel"), style: "cancel" },
                {
                    text: t("common.delete"),
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const response = await fetch(`${api.deleteRecord}/${entry._id}`, {
                                method: "DELETE",
                                headers: {
                                    Authorization: `Bearer ${token}`,
                                },
                            });
                            const data = await response.json();
                            if (data.success) {
                                setTodayEntries((prev) => prev.filter((e) => e._id !== entry._id));
                            } else {
                                Alert.alert(t("common.error"), data.message || t("records.failed_delete_entry"));
                            }
                        } catch (error) {
                            console.error("Delete Error:", error);
                            Alert.alert(t("common.error"), t("records.failed_delete_entry"));
                        }
                    },
                },
            ]
        );
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

    // Same as filteredUser, but keeps the entry's current farmer visible/selectable
    const editFilteredUser = customers
        .filter((c) => c._id === editingListEntry?.byUser?._id || !existingUserIds.includes(c._id))
        .sort((a, b) => {
            if (a.positionNo === undefined && b.positionNo === undefined) return 0;
            if (a.positionNo === undefined) return 1;
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
                onEditEntry={handleEditListEntry}
                onDeleteEntry={handleDeleteListEntry}
            />


            <UserModal
                title={t("entry.farmer")}
                showUserSelector={showUserSelector}
                setShowUserSelector={setShowUserSelector}
                filteredUser={filteredUser}
                selectedUser={selectedUser}
                setSelectedUser={setSelectedUser}
                updateFormData={updateFormData}
                weightRef={weightRef}
            />

            <ModalWrapper
                visible={!!editingListEntry}
                setVisibility={() => setEditingListEntry(null)}
                headerText={t("entry.edit_entry")}
            >
                <EntryForm
                    editingEntry={editingListEntry}
                    formData={editFormData}
                    selectedUser={editSelectedUser}
                    updateFormData={updateEditFormData}
                    setShowUserSelector={setShowEditUserSelector}
                    disableUserSelector
                    weightRef={editWeightRef}
                    handleSubmit={handleUpdateListEntry}
                    isSubmitting={isUpdatingListEntry}
                />
            </ModalWrapper>

            <UserModal
                title={t("entry.farmer")}
                showUserSelector={showEditUserSelector}
                setShowUserSelector={setShowEditUserSelector}
                filteredUser={editFilteredUser}
                selectedUser={editSelectedUser}
                setSelectedUser={setEditSelectedUser}
                updateFormData={updateEditFormData}
                weightRef={editWeightRef}
            />

        </>
    );
}
