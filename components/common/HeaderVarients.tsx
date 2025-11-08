import { CustomerRole } from '@/constants/types'
import { onExportPDF } from '@/utils/pdf'
import { Feather, Ionicons, MaterialIcons } from '@expo/vector-icons'
import { DrawerActions, useNavigation } from "@react-navigation/native"
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native"
import Animated, { FadeInDown } from 'react-native-reanimated'
import { MilkEntry } from '../admin/milkRecords/milkBuyRecords'
import { CustomHeader, type HeaderAction } from "./CustomHeader"

type ExtendedCustomerRole = CustomerRole | "All";

interface UsersHeaderProps {
    onRoleFilter?: (role: CustomerRole | "All") => void
    onSearch?: (searchText: string) => void
    selectedRole?: CustomerRole | "All"
    setCreateUserModalVisible?: (visible: boolean) => void
    createUserModalVisible?: boolean
}


type RearrangeHeaderProps = {
    onRoleFilter?: (role: CustomerRole) => void
    setIsEditMode: (isEditMode: boolean) => void
    isEditMode?: boolean,
    selectedRole?: CustomerRole
    handleSaveOrder: () => void
    handleResetOrder: () => void
}

// Milk Entry Header with date
type MilkEntryHeaderProps = {
    entryType: string;
    setEntryType: (type: string) => void;
    entryData?: MilkEntry[]; // Optional, if you want to pass data for export
};
interface ProfileProps {
    isEditing: boolean;
    setIsEditing: (isEditing: boolean) => void;
}

interface ProductsHeaderProps {
    addNewProduct: () => void;
}

interface FarmerDashboardProps {
    name: string;
    profilePic: string;
}


interface RateChartHeaderProps {
    fetchDataFromServer: () => void;
    saveDataToServer: () => void;
}

// Dashboard Header with stats
export const DashboardHeader = ({
    setLanguageModal,
    title,
    subtitle
}: {
    setLanguageModal: React.Dispatch<React.SetStateAction<boolean>>;
    title: string
    subtitle: string
}) => {
    const actions: HeaderAction[] = [
        {
            icon: "language",
            iconFamily: "image",
            onPress: () => setLanguageModal(true),
        },
    ];

    return (
        <CustomHeader
            title={title}
            subtitle={subtitle}
            actions={actions}
        />
    );
};


interface BuyerProps {
    title: string;
    desc: string;
}

export const BuyerDashboardHeader: React.FC<BuyerProps> = ({ title, desc }) => {
    const actions: HeaderAction[] = [
        {
            icon: "notifications-outline",
            onPress: () => console.log("Notifications pressed"),
        },
    ]

    return (
        <CustomHeader
            title={title}
            subtitle={desc}
            actions={actions}
        />
    )
}


export const ProductsHeader: React.FC<ProductsHeaderProps> = ({ addNewProduct }) => {
    const actions: HeaderAction[] = [
        {
            icon: "add-circle-outline",
            onPress: () => addNewProduct(),
        },

    ]

    return (
        <CustomHeader
            title="products.product_management"
            actions={actions}
        />
    )
}
export const PaymentHeader: React.FC<ProductsHeaderProps> = ({ addNewProduct }) => {
    const actions: HeaderAction[] = [
        {
            icon: "add-circle-outline",
            onPress: () => addNewProduct(),
        },

    ]

    return (
        <CustomHeader
            title="navigation.payments"
            actions={actions}
        />
    )
}


export const MilkEntryHeader = ({ entryType, setEntryType }: MilkEntryHeaderProps) => {

    const actions: HeaderAction[] = [
        {
            icon: "swap-vertical-outline",
            onPress: () => entryType === "Milk Buy" ? setEntryType("Milk Sale") : setEntryType("Milk Buy"),
        },
    ]

    return <CustomHeader title={entryType === "Milk Buy" ? "entry.milk_buy" : "entry.milk_sale"} actions={actions} />
}

// Records Header with filter options
export const RecordsHeader = ({ entryType, setEntryType, entryData }: MilkEntryHeaderProps) => {
    const [loading, setLoading] = useState(false);
    const actions: HeaderAction[] = [
        loading
            ? {
                icon: "loading",
                isSpinner: true,
                onPress: () => { },
            }
            : {
                icon: "picture-as-pdf",
                iconFamily: "MaterialIcons",
                onPress: () => {
                    void (async () => {
                        setLoading(true);
                        try {
                            await onExportPDF(entryData || []);
                        } finally {
                            setLoading(false);
                        }
                    })()
                },
            }
        ,
        {
            icon: "swap-vertical-outline",
            onPress: () => entryType === "Milk Buy" ? setEntryType("Milk Sale") : setEntryType("Milk Buy"),
        },
    ]

    return (
        <CustomHeader title={entryType === "Milk Buy" ? "entry.milk_buy" : "entry.milk_sale"} actions={actions} />
    )
}

// Profile Header with avatar
export const ProfileHeader: React.FC<ProfileProps> = ({ isEditing, setIsEditing }) => {
    const actions: HeaderAction[] = [
        {
            icon: "create-outline",
            onPress: () => setIsEditing(!isEditing),
        },
    ]

    return <CustomHeader title={"common.profile"} actions={actions} backgroundColor="#f8fafc" />
}

// Settings Header
export const SettingsHeader = () => {
    return <CustomHeader title={"common.settings"} subtitle="settings.manage_your_preferences" />
}




export const RateChartHeader: React.FC<RateChartHeaderProps> = ({ fetchDataFromServer, saveDataToServer }) => {
    const actions: HeaderAction[] = [
        {
            icon: "save-outline",
            onPress: () => saveDataToServer(),
        },
        {
            icon: "refresh-outline",
            onPress: () => fetchDataFromServer(),
        },
    ]

    return <CustomHeader title={"headers.rate_chart_manager"} backgroundColor="#f8fafc" actions={actions} />
}

export const UsersHeader: React.FC<UsersHeaderProps> = ({
    onRoleFilter,
    onSearch,
    selectedRole = "All",
    setCreateUserModalVisible,
    createUserModalVisible
}) => {
    const [showFilters, setShowFilters] = useState(false)
    const [showSearch, setShowSearch] = useState(false)
    const [searchText, setSearchText] = useState('')
    const navigation = useNavigation()
    const { t } = useTranslation()

    const handleMenuPress = () => {
        navigation.dispatch(DrawerActions.openDrawer())
    }

    const roles: { key: ExtendedCustomerRole; label: string; icon: string }[] = [
        { key: "All", label: "All Users", icon: "people" },
        { key: "Farmer", label: "Farmers", icon: "agriculture" },
        { key: "Buyer", label: "Buyers", icon: "shopping-cart" },
        { key: "User", label: "Users", icon: "person" },
    ]

    const handleRoleSelect = (role: ExtendedCustomerRole) => {
        if (role !== "All") {
            onRoleFilter?.(role)
        }
        setShowFilters(false)
    }

    const handleSearchChange = (text: string) => {
        setSearchText(text)
        onSearch?.(text)
    }

    const clearSearch = () => {
        setSearchText('')
        onSearch?.('')
        setShowSearch(false)
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.iconButton} onPress={handleMenuPress} activeOpacity={0.7}>
                    <Ionicons name="menu" size={24} color={"#111827"} />
                </TouchableOpacity>
                <View style={styles.titleSection}>
                    <Text style={styles.title}>{t("headers.all_users")}</Text>
                    <Text style={styles.subtitle}>
                        {selectedRole === "All" ? t("headers.showing_all_users") : `${t("headers.filter_by")} ${selectedRole}`}
                    </Text>
                </View>

                <View style={styles.actionsContainer}>
                    <TouchableOpacity
                        style={[styles.actionButton, createUserModalVisible && styles.actionButtonActive]}
                        onPress={() => setCreateUserModalVisible?.(true)}
                        activeOpacity={0.7}
                    >
                        <Feather name="plus" size={20} color={showSearch ? "#3b82f6" : "#64748b"} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionButton, showSearch && styles.actionButtonActive]}
                        onPress={() => setShowSearch(!showSearch)}
                        activeOpacity={0.7}
                    >
                        <Feather name="search" size={20} color={showSearch ? "#3b82f6" : "#64748b"} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionButton, showFilters && styles.actionButtonActive]}
                        onPress={() => setShowFilters(!showFilters)}
                        activeOpacity={0.7}
                    >
                        <MaterialIcons name="filter-list" size={20} color={showFilters ? "#3b82f6" : "#64748b"} />
                        {selectedRole !== "All" && <View style={styles.filterIndicator} />}
                    </TouchableOpacity>
                </View>
            </View>

            {showSearch && (
                <Animated.View entering={FadeInDown.duration(300)} style={styles.searchContainer}>
                    <View style={styles.searchInputContainer}>
                        <Feather name="search" size={16} color="#64748b" style={styles.searchIcon} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search by name, mobile, or dairy name..."
                            value={searchText}
                            onChangeText={handleSearchChange}
                            autoFocus
                            placeholderTextColor="#94a3b8"
                        />
                        {searchText.length > 0 && (
                            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
                                <MaterialIcons name="close" size={16} color="#64748b" />
                            </TouchableOpacity>
                        )}
                    </View>
                </Animated.View>
            )}

            {showFilters && (
                <Animated.View entering={FadeInDown.duration(300)} style={styles.filtersContainer}>
                    <Text style={styles.filtersTitle}>{t("headers.filter_by_role")}</Text>
                    <View style={styles.roleButtons}>
                        {roles.map((role) => (
                            <TouchableOpacity
                                key={role.key}
                                style={[
                                    styles.roleButton,
                                    selectedRole === role.key && styles.roleButtonSelected
                                ]}
                                onPress={() => handleRoleSelect(role.key)}
                                activeOpacity={0.7}
                            >
                                <MaterialIcons
                                    name={role.icon as any}
                                    size={16}
                                    color={selectedRole === role.key ? "#ffffff" : "#64748b"}
                                />
                                <Text style={[
                                    styles.roleButtonText,
                                    selectedRole === role.key && styles.roleButtonTextSelected
                                ]}>
                                    {role.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </Animated.View>
            )}
        </View>
    )
}

export const ReaarangeUsersHeader: React.FC<RearrangeHeaderProps> = ({
    onRoleFilter,
    setIsEditMode,
    selectedRole,
    handleSaveOrder,
    handleResetOrder,
    isEditMode
}) => {
    const [showFilters, setShowFilters] = useState(false)
    const navigation = useNavigation()
    const { t } = useTranslation()

    const handleMenuPress = () => {
        navigation.dispatch(DrawerActions.openDrawer())
    }

    const roles: { key: CustomerRole; label: string; icon: string }[] = [
        { key: "Farmer", label: "Farmers", icon: "agriculture" },
        { key: "Buyer", label: "Buyers", icon: "shopping-cart" },
    ]

    const handleRoleSelect = (role: CustomerRole) => {
        onRoleFilter?.(role)
        setShowFilters(false)
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.iconButton} onPress={handleMenuPress} activeOpacity={0.7}>
                    <Ionicons name="menu" size={24} color={"#111827"} />
                </TouchableOpacity>
                <View style={styles.titleSection}>
                    <Text style={styles.title}>{t("headers.rearrange_users")}</Text>
                    <Text style={styles.subtitle}>
                        {`Filtered by ${selectedRole}`}
                    </Text>
                </View>

                <View style={styles.actionsContainer}>
                    <TouchableOpacity
                        style={[styles.actionButton, isEditMode && styles.actionButtonActive]}
                        onPress={() => setIsEditMode(true)}
                        activeOpacity={0.7}
                    >
                        <Feather name="edit" size={20} color={isEditMode ? "#3b82f6" : "#64748b"} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionButton, showFilters && styles.actionButtonActive]}
                        onPress={() => setShowFilters(!showFilters)}
                        activeOpacity={0.7}
                    >
                        <MaterialIcons name="filter-list" size={20} color={showFilters ? "#3b82f6" : "#64748b"} />
                        {<View style={styles.filterIndicator} />}
                    </TouchableOpacity>
                </View>
            </View>

            {isEditMode && (
                <Animated.View entering={FadeInDown.duration(300)} style={styles.searchContainer}>
                    <View style={styles.editActions}>
                        <TouchableOpacity style={styles.saveButton} onPress={handleSaveOrder}>
                            <Ionicons name="checkmark-outline" size={20} color="#fff" />
                            <Text style={styles.buttonText}>{t("common.save")}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.cancelButton} onPress={() => setIsEditMode(false)}>
                            <Ionicons name="close-outline" size={20} color="#666" />
                            <Text style={styles.cancelButtonText}>{t("common.cancel")}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.resetButton} onPress={handleResetOrder}>
                            <Ionicons name="refresh-outline" size={20} color="#ff6b6b" />
                            <Text style={styles.resetButtonText}>{t("common.reset")}</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            )}

            {showFilters && (
                <Animated.View entering={FadeInDown.duration(300)} style={styles.filtersContainer}>
                    <View style={styles.roleButtons}>
                        {roles.map((role) => (
                            <TouchableOpacity
                                key={role.key}
                                style={[
                                    styles.roleButton,
                                    selectedRole === role.key && styles.roleButtonSelected
                                ]}
                                onPress={() => handleRoleSelect(role.key)}
                                activeOpacity={0.7}
                            >
                                <MaterialIcons
                                    name={role.icon as any}
                                    size={16}
                                    color={selectedRole === role.key ? "#ffffff" : "#64748b"}
                                />
                                <Text style={[
                                    styles.roleButtonText,
                                    selectedRole === role.key && styles.roleButtonTextSelected
                                ]}>
                                    {role.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </Animated.View>
            )}
        </View>
    )
}

// farmer side

export const FarmerDashboardHeader: React.FC<FarmerDashboardProps> = ({ name, profilePic }) => {


    return (
        <CustomHeader
            subtitle={"headers.welcome_milk_dashboard"}
            title={"common.welcome"}
        />
    )
}

export const FarmerRecordsHeader = () => {
    return (
        <CustomHeader title={"navigation.milk_records"} />
    )
}

export const FarmerRateChartHeader = () => {


    return <CustomHeader title={"navigation.rate_chart"} backgroundColor="#f8fafc" />
}


const styles = StyleSheet.create({
    container: {
        backgroundColor: "#f8fafc",
        borderBottomWidth: 1,
        borderBottomColor: "#e2e8f0",
    },
    iconButton: {
        padding: 8,
        borderRadius: 20,
        marginHorizontal: 4,
    },
    leftSection: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
        justifyContent: "flex-start",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 4,
    },
    titleSection: {
        flex: 1,
    },
    title: {
        fontSize: 18,
        fontWeight: "700",
        color: "#1e293b",
        marginBottom: 2,
    },
    subtitle: {
        fontSize: 12,
        color: "#64748b",
        fontWeight: "500",
    },
    actionsContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
    actionButton: {
        padding: 10,
        borderRadius: 8,
        backgroundColor: "#ffffff",
        marginLeft: 8,
        borderWidth: 1,
        borderColor: "#e2e8f0",
        position: "relative",
    },
    actionButtonActive: {
        backgroundColor: "#eff6ff",
        borderColor: "#3b82f6",
    },
    filterIndicator: {
        position: "absolute",
        top: 6,
        right: 6,
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: "#ef4444",
    },
    searchContainer: {
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    searchInputContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#ffffff",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#e2e8f0",
        paddingHorizontal: 12,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 12,
        fontSize: 16,
        color: "#1e293b",
    },
    clearButton: {
        padding: 4,
    },
    filtersContainer: {
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    filtersTitle: {
        fontSize: 14,
        fontWeight: "600",
        color: "#374151",
        marginBottom: 12,
    },
    roleButtons: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    roleButton: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: "#ffffff",
        borderWidth: 1,
        borderColor: "#e2e8f0",
    },
    roleButtonSelected: {
        backgroundColor: "#3b82f6",
        borderColor: "#3b82f6",
    },
    roleButtonText: {
        fontSize: 14,
        color: "#64748b",
        fontWeight: "500",
        marginLeft: 6,
    },
    roleButtonTextSelected: {
        color: "#ffffff",
        fontWeight: "600",
    },

    editActions: {
        flexDirection: "row",
        gap: 12,
    },
    saveButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#28a745",
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    cancelButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#e9ecef",
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    resetButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#ff6b6b",
    },
    buttonText: {
        color: "#fff",
        fontWeight: "600",
        marginLeft: 8,
    },
    cancelButtonText: {
        color: "#666",
        fontWeight: "600",
        marginLeft: 8,
    },
    resetButtonText: {
        color: "#ff6b6b",
        fontWeight: "600",
        marginLeft: 8,
    },
})
