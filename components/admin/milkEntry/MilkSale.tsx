import ModalWrapper from "@/components/common/ModalWrapper"
import UserModal from "@/components/common/UserModal"
import { api } from "@/constants/api"
import { MilkEntry, MilkEntryFormData, MilkType, ShiftType, User } from "@/constants/types"
import useCustomers from "@/hooks/useCustomer"
import { calculateTotal, fetchTodayEntries, handleDeleteEntry } from "@/utils/helper"
import { Feather, FontAwesome } from "@expo/vector-icons"
import DateTimePicker from "@react-native-community/datetimepicker"
import { format } from "date-fns"
import { LinearGradient } from "expo-linear-gradient"
import { useFocusEffect } from "expo-router"
import { useCallback, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
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

type MilkSaleEntryProps = {
    onWalletAmountChange?: (amount: number | null) => void;
};

export default function MilkSaleEntry({ onWalletAmountChange }: MilkSaleEntryProps = {}) {
    const [showUserSelector, setShowUserSelector] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [selectedUser, setSelectedUser] = useState<User | null>(null)
    const [showDatePicker, setShowDatePicker] = useState(false)
    const [todayEntries, setTodayEntries] = useState<MilkEntry[]>([])
    const [isLoadingEntries, setIsLoadingEntries] = useState(false)
    const [showOptionsModal, setShowOptionsModal] = useState(false)
    const [selectedEntry, setSelectedEntry] = useState<MilkEntry | null>(null)
    const [editingEntry, setEditingEntry] = useState<MilkEntry | null>(null)

    const { customers, token, refresh: refreshCustomers } = useCustomers({ role: "Buyer", activeOnly: true })
    const { t } = useTranslation()
    const weightRef = useRef<TextInput>(null);
    const rateRef = useRef<TextInput>(null);

    const [formData, setFormData] = useState<MilkEntryFormData>({
        userId: "",
        weight: "",
        rate: "",
        date: format(new Date(), "yyyy-MM-dd"),
        shift: new Date().getHours() < 12 ? ShiftType.Morning : ShiftType.Evening,
        milkType: MilkType.Cow,
    })

    // Editing an existing entry from today's entries list (separate modal, distinct from the create form above)
    const [editingListEntry, setEditingListEntry] = useState<MilkEntry | null>(null)
    const [editSelectedUser, setEditSelectedUser] = useState<User | null>(null)
    const [isUpdatingListEntry, setIsUpdatingListEntry] = useState(false)
    const [showEditDatePicker, setShowEditDatePicker] = useState(false)
    const [editFormData, setEditFormData] = useState<MilkEntryFormData>({
        userId: "",
        weight: "",
        rate: "",
        date: format(new Date(), "yyyy-MM-dd"),
        shift: ShiftType.Morning,
        milkType: MilkType.Cow,
    })


    // Helper function to update form data
    const updateFormData = (field: string, value: string) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }))
    }



    // Load entries when date or shift changes
    useEffect(() => {
        if (token) {
            fetchTodayEntries(api.milkSales, setIsLoadingEntries, formData.date, formData.shift, setTodayEntries)
        }
    }, [formData.date, formData.shift, token])

    // Fetch and report the selected buyer's wallet amount to the parent header
    useEffect(() => {
        if (!selectedUser?._id || !token) {
            onWalletAmountChange?.(null)
            return
        }
        let isCancelled = false
        ;(async () => {
            try {
                const response = await fetch(`${api.getUser}?userId=${selectedUser._id}`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                })
                const data = await response.json()
                if (!isCancelled && data.success) {
                    onWalletAmountChange?.(data.user?.walletAmount ?? null)
                }
            } catch (error) {
                console.error("Error fetching wallet amount:", error)
            }
        })()
        return () => {
            isCancelled = true
        }
    }, [selectedUser?._id, token])

    useFocusEffect(
        useCallback(() => {
            resetForm();
            fetchTodayEntries(api.milkSales, setIsLoadingEntries, formData.date, formData.shift, setTodayEntries)
            refreshCustomers();
        }, [refreshCustomers])
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
            rate: "",
            date: format(new Date(), "yyyy-MM-dd"),
            shift: new Date().getHours() < 12 ? ShiftType.Morning : ShiftType.Evening,
            milkType: MilkType.Cow,
        })
        setSelectedUser(null)
        setEditingEntry(null)
    }

    // Handle submit
    const handleSubmit = async () => {
        if (!formData.userId) {
            Alert.alert(t("common.error"), t("validation.user"))
            return
        }

        if (!formData.weight || !formData.rate) {
            Alert.alert(t("common.error"), t("validation.all_fields_required"))
            return
        }

        setIsSubmitting(true)

        try {
            const entryData = {
                userId: formData.userId,
                date: formData.date,
                shift: formData.shift,
                weight: formData.weight,
                rate: formData.rate,
                price: calculateTotal(formData.weight, formData.rate),
                milkType: formData.milkType,
            }

            const url = editingEntry ? `${api.milkSales}/${editingEntry._id}` : api.milkSales
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
                Alert.alert(t("common.success"), data.message)

                if (editingEntry) {
                    resetForm()
                } else {
                    // Auto-select the next buyer in line (filteredUser is sorted by
                    // positionNo and already excludes anyone with an entry today) so
                    // the admin can rattle through entries without reopening the picker.
                    const currentIndex = filteredUser.findIndex((u) => u._id === formData.userId)
                    const nextUser = currentIndex >= 0 ? filteredUser[currentIndex + 1] : undefined
                    const canPrefill = !!(nextUser?.role === "Buyer" && nextUser.milkRate && nextUser.morningMilk && nextUser.eveningMilk)

                    setSelectedUser(nextUser ?? null)
                    setFormData((prev) => ({
                        ...prev,
                        userId: nextUser?._id ?? "",
                        weight: canPrefill ? (prev.shift === "Morning" ? nextUser!.morningMilk! : nextUser!.eveningMilk!) : "",
                        rate: canPrefill ? nextUser!.milkRate! : "",
                    }))
                    if (nextUser) {
                        setTimeout(() => weightRef.current?.focus(), 300)
                    }
                }

                fetchTodayEntries(api.milkSales, setIsLoadingEntries, formData.date, formData.shift, setTodayEntries)

            } else {
                Alert.alert(t("common.error"), data.message)
            }
        } catch (error) {
            console.error("Submit Error:", error)
            Alert.alert(t("common.error"), t("records.failed_update_entry"))
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
            rate: entry.rate.toString(),
            date: entry.date,
            shift: entry.shift,
            milkType: entry.milkType,
        })
        setShowOptionsModal(false)
    }

    // Helper function to update the today's-entry edit form data
    const updateEditFormData = (field: string, value: string) => {
        setEditFormData((prev) => ({
            ...prev,
            [field]: value,
        }))
    }

    // Open the edit modal for an entry from today's entries list
    const handleEditListEntry = (entry: MilkEntry) => {
        setEditingListEntry(entry)
        setEditSelectedUser(customers.find((c) => c._id === entry.byUser._id) ?? null)
        setEditFormData({
            userId: entry.byUser._id,
            weight: String(entry.weight ?? ""),
            rate: String(entry.rate ?? ""),
            date: entry.date,
            shift: entry.shift,
            milkType: entry.milkType,
        })
    }

    // Handle edit modal date picker change
    const onEditDateChange = (event: any, selectedDate?: Date) => {
        setShowEditDatePicker(false)
        if (selectedDate) {
            updateEditFormData("date", format(selectedDate, "yyyy-MM-dd"))
        }
    }

    // Submit the today's-entry edit
    const handleUpdateListEntry = async () => {
        if (!editingListEntry) return

        if (!editFormData.weight || !editFormData.rate) {
            Alert.alert(t("common.error"), t("validation.all_fields_required"))
            return
        }

        setIsUpdatingListEntry(true)

        try {
            const entryData = {
                userId: editFormData.userId,
                date: editFormData.date,
                shift: editFormData.shift,
                weight: editFormData.weight,
                rate: editFormData.rate,
                price: calculateTotal(editFormData.weight, editFormData.rate),
                milkType: editFormData.milkType,
            }

            const response = await fetch(`${api.milkSales}/${editingListEntry._id}`, {
                method: "PUT",
                body: JSON.stringify(entryData),
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            })

            const data = await response.json()

            if (data.success) {
                Alert.alert(t("common.success"), data.message)
                setEditingListEntry(null)
                fetchTodayEntries(api.milkSales, setIsLoadingEntries, formData.date, formData.shift, setTodayEntries)
            } else {
                Alert.alert(t("common.error"), data.message)
            }
        } catch (error) {
            console.error("Update Error:", error)
            Alert.alert(t("common.error"), t("records.failed_update_entry"))
        } finally {
            setIsUpdatingListEntry(false)
        }
    }

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
                            const response = await fetch(`${api.milkSales}/${entry._id}`, {
                                method: "DELETE",
                                headers: {
                                    Authorization: `Bearer ${token}`,
                                },
                            })
                            const data = await response.json()
                            if (data.success) {
                                setTodayEntries((prev) => prev.filter((e) => e._id !== entry._id))
                            } else {
                                Alert.alert(t("common.error"), data.message || t("records.failed_delete_entry"))
                            }
                        } catch (error) {
                            console.error("Delete Error:", error)
                            Alert.alert(t("common.error"), t("records.failed_delete_entry"))
                        }
                    },
                },
            ]
        )
    }

    const existingUserIds = todayEntries.map(entry => entry.byUser._id);
    const filteredUser = customers
        .filter(c => !existingUserIds.includes(c._id))
        .sort((a, b) => {
            if (a.positionNo === undefined && b.positionNo === undefined) return 0;
            if (a.positionNo === undefined) return 1; // move undefined to end
            if (b.positionNo === undefined) return -1;
            return a.positionNo - b.positionNo
        });


    // Render entry options modal
    const renderEntryOptionsModal = () => (
        <Modal visible={showOptionsModal} animationType="fade" transparent statusBarTranslucent={true}>
            <View style={styles.modalOverlay}>
                <View style={styles.optionsModalContent}>
                    <Text style={styles.optionsModalTitle}>{t("entry.edit_entry")}</Text>
                    <TouchableOpacity style={styles.optionButton} onPress={() => selectedEntry && handleEditEntry(selectedEntry)}>
                        <View style={styles.optionIconContainer}>
                            <Feather name="edit" size={20} color="#0ea5e9" />
                        </View>
                        <Text style={styles.optionButtonText}>{t("entry.edit_entry")}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.optionButton, styles.deleteOptionButton]}
                        onPress={() => {
                            setShowOptionsModal(false)
                            selectedEntry && handleDeleteEntry(selectedEntry._id, () => fetchTodayEntries(api.milkSales, setIsLoadingEntries, formData.date, formData.shift, setTodayEntries)
                                , token)
                        }}
                    >
                        <View style={[styles.optionIconContainer, styles.deleteIconContainer]}>
                            <Feather name="trash-2" size={20} color="#ef4444" />
                        </View>
                        <Text style={[styles.optionButtonText, styles.deleteOptionText]}>{t("entry.delete_entry")}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.cancelButton} onPress={() => setShowOptionsModal(false)}>
                        <Text style={styles.cancelButtonText}>{t("common.cancel")}</Text>
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
                            <Text style={styles.editingBannerText}>{t("entry.editing")}: {selectedUser?.name}</Text>
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
                                if (selectedUser && selectedUser.morningMilk && selectedUser.eveningMilk) {
                                    updateFormData("weight", formData.shift === "Morning" ? selectedUser.eveningMilk : selectedUser.morningMilk)
                                }
                            }}
                        >
                            <Text style={styles.compactFieldText}>
                                {formData.shift === "Morning" ? "🌅" : "🌙"} {formData.shift === "Morning" ? t("entry.morning") : t("entry.evening")}
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
                        <Text style={styles.userSelectorText}>{selectedUser ? selectedUser.name : t("entry.select_buyer")}</Text>
                        <Feather name="chevron-down" size={16} color="#64748b" />
                    </TouchableOpacity>

                    {/* Input fields in two rows */}
                    <View style={styles.inputRow}>
                        <View style={styles.inputContainer}>
                            <FontAwesome name="balance-scale" size={16} color="#38bdf8" />
                            <TextInput
                                ref={weightRef}
                                style={styles.input}
                                placeholder={t("entry.weight")}
                                placeholderTextColor="#93c5fd"
                                value={formData.weight}
                                onChangeText={(value) => updateFormData("weight", value)}
                                keyboardType="decimal-pad"
                                returnKeyType="next"
                                onSubmitEditing={() => rateRef.current?.focus()}
                            />
                            <Text style={styles.inputUnit}>L</Text>
                        </View>
                    </View>
                    <View style={styles.inputRow}>
                        <View style={styles.inputContainer}>
                            <FontAwesome name="rupee" size={16} color="#10b981" />
                            <TextInput
                                ref={rateRef}
                                style={styles.input}
                                placeholder={t("records.rate")}
                                placeholderTextColor="#93c5fd"
                                value={formData.rate}
                                onChangeText={(value) => updateFormData("rate", value)}
                                keyboardType="decimal-pad"
                                onSubmitEditing={() => handleSubmit()}
                            />

                        </View>
                    </View>

                    {/* Total and Submit */}
                    <View style={styles.bottomRow}>
                        <View style={styles.totalDisplay}>
                            <Text style={styles.totalLabel}>{t("entry.total")}: </Text>
                            <Text style={styles.totalValue}>₹{calculateTotal(formData.weight, formData.rate)}</Text>
                        </View>

                        <TouchableOpacity
                            style={styles.submitButton}
                            disabled={isSubmitting || !selectedUser}
                            onPress={handleSubmit}
                        >
                            <LinearGradient colors={["#0ea5e9", "#0284c7"]} style={styles.submitGradient}>
                                <FontAwesome name={editingEntry ? "save" : "plus"} size={16} color="white" />
                                <Text style={styles.submitButtonText}>
                                    {isSubmitting ? t("common.saving") : editingEntry ? t("common.update") : t("common.add")}
                                </Text>
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
                text={t("entry.today_sale")}
                url={api.milkSales}
                todayEntries={todayEntries}
                setTodayEntries={setTodayEntries}
                fetchTodayEntries={fetchTodayEntries}
                shift={formData.shift}
                date={formData.date}
                isLoadingEntries={isLoadingEntries}
                setIsLoadingEntries={setIsLoadingEntries}
                onEditEntry={handleEditListEntry}
                onDeleteEntry={handleDeleteListEntry}
            />

            {<UserModal title={t("entry.buyer")} showUserSelector={showUserSelector} setShowUserSelector={setShowUserSelector} filteredUser={filteredUser} selectedUser={selectedUser} setSelectedUser={setSelectedUser} updateFormData={updateFormData} weightRef={weightRef} />}

            {renderEntryOptionsModal()}

            <ModalWrapper
                visible={!!editingListEntry}
                setVisibility={() => setEditingListEntry(null)}
                headerText={t("entry.edit_entry")}
            >
                <View style={styles.editModalBody}>
                    {/* Date, Shift and Milk Type in one row */}
                    <View style={styles.topRow}>
                        <TouchableOpacity onPress={() => setShowEditDatePicker(true)} style={styles.compactField}>
                            <FontAwesome name="calendar" size={14} color="#0284c7" />
                            <Text style={styles.compactFieldText}>{format(new Date(editFormData.date), "dd/MM")}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.compactField}
                            onPress={() => {
                                const newShift = editFormData.shift === "Morning" ? "Evening" : "Morning"
                                updateEditFormData("shift", newShift)
                            }}
                        >
                            <Text style={styles.compactFieldText}>
                                {editFormData.shift === "Morning" ? "🌅" : "🌙"} {editFormData.shift === "Morning" ? t("entry.morning") : t("entry.evening")}
                            </Text>
                        </TouchableOpacity>

                        <View style={styles.milkTypeToggle}>
                            <TouchableOpacity
                                style={[styles.milkTypeBtn, editFormData.milkType === "Cow" && styles.milkTypeBtnActive]}
                                onPress={() => updateEditFormData("milkType", "Cow")}
                            >
                                <Text style={styles.milkTypeText}>🐄</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.milkTypeBtn, editFormData.milkType === "Buffalo" && styles.milkTypeBtnActive]}
                                onPress={() => updateEditFormData("milkType", "Buffalo")}
                            >
                                <Text style={styles.milkTypeText}>🐃</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Buyer (disabled — can't reassign an existing entry to a different buyer) */}
                    <View style={[styles.userSelector, styles.userSelectorDisabled]}>
                        <FontAwesome name="user" size={16} color="#94a3b8" />
                        <Text style={styles.userSelectorText}>{editSelectedUser?.name ?? t("entry.select_buyer")}</Text>
                    </View>

                    {/* Weight */}
                    <View style={styles.inputRow}>
                        <View style={styles.inputContainer}>
                            <FontAwesome name="balance-scale" size={16} color="#38bdf8" />
                            <TextInput
                                style={styles.input}
                                placeholder={t("entry.weight")}
                                placeholderTextColor="#93c5fd"
                                value={editFormData.weight}
                                onChangeText={(value) => updateEditFormData("weight", value)}
                                keyboardType="decimal-pad"
                            />
                            <Text style={styles.inputUnit}>L</Text>
                        </View>
                    </View>

                    {/* Rate */}
                    <View style={styles.inputRow}>
                        <View style={styles.inputContainer}>
                            <FontAwesome name="rupee" size={16} color="#10b981" />
                            <TextInput
                                style={styles.input}
                                placeholder={t("records.rate")}
                                placeholderTextColor="#93c5fd"
                                value={editFormData.rate}
                                onChangeText={(value) => updateEditFormData("rate", value)}
                                keyboardType="decimal-pad"
                            />
                        </View>
                    </View>

                    {/* Total and Submit */}
                    <View style={styles.bottomRow}>
                        <View style={styles.totalDisplay}>
                            <Text style={styles.totalLabel}>{t("entry.total")}: </Text>
                            <Text style={styles.totalValue}>₹{calculateTotal(editFormData.weight, editFormData.rate)}</Text>
                        </View>

                        <TouchableOpacity
                            style={styles.submitButton}
                            disabled={isUpdatingListEntry}
                            onPress={handleUpdateListEntry}
                        >
                            <LinearGradient colors={["#0ea5e9", "#0284c7"]} style={styles.submitGradient}>
                                <FontAwesome name="save" size={16} color="white" />
                                <Text style={styles.submitButtonText}>
                                    {isUpdatingListEntry ? t("common.saving") : t("common.update")}
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>

                    {showEditDatePicker && (
                        <DateTimePicker
                            value={new Date(editFormData.date)}
                            mode="date"
                            display="default"
                            onChange={onEditDateChange}
                            maximumDate={new Date()}
                        />
                    )}
                </View>
            </ModalWrapper>
        </>
    )
}


const styles = StyleSheet.create({
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
    userSelectorDisabled: {
        backgroundColor: "#f1f5f9",
        borderColor: "#cbd5e1",
    },
    editModalBody: {
        padding: 16,
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
    entryItem: {
        backgroundColor: "white",
        borderRadius: 10,
        padding: 12,
        marginBottom: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        width: (screenWidth - 44) / 2,
    },
    entryHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 8,
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
