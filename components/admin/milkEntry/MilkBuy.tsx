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

export default function MilkBuyEntry() {
    const [rateChart, setRateChart] = useState<RateChartRow[]>();
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
                Alert.alert("Error", data.message || "Failed to fetch data")
            }

        } catch (error) {
            Alert.alert("Error", "Failed to fetch data from server")
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
