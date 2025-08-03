import { Feather, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons"
import type React from "react"
import { useCallback, useMemo, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native"
import Animated, { FadeInDown } from "react-native-reanimated"

// Define Customer type with role
type CustomerRole = "User" | "Farmer" | "Buyer"

export type Customer = {
  _id: string
  id: string
  name: string
  profilePic: string
  isVerified: boolean
  mobile: string
  fatherName: string
  dailryName: string
  collectionCenter: string
  createdAt: string
  role: CustomerRole
  morningMilk?: string
  eveningMilk?: string
  milkRate?: string

}

// Import your components and hooks
import BuyerRateConfigModal from "@/components/admin/users/BuyerRateConfigModal"
import CreateUserModal from "@/components/admin/users/CreateUserModal"
import RoleCheckBox from "@/components/admin/users/RoleCheckBox"
import { UsersHeader } from "@/components/common/HeaderVarients"
import DairyLoadingScreen from "@/components/Loading"
import { api } from "@/constants/api"
import useCustomers from "@/hooks/useCustomer"
import { useFocusEffect } from "expo-router"
import Toast from "react-native-toast-message"

const ImprovedCustomersList: React.FC = () => {
  // Filter and search states
  const [selectedRole, setSelectedRole] = useState<CustomerRole | "All">("All")
  const [searchText, setSearchText] = useState("")
  const [createUserModalVisible, setCreateUserModalVisible] = useState(false)
  const [buyerRateModalVisible, setBuyerRateModalVisible] = useState<Customer | null>(null)

  // Use the hook with role filter
  const { customers, loading, refreshing, refresh, token } = useCustomers({
    role: selectedRole === "All" ? undefined : selectedRole,
  })

  // State for managing role changes and saving
  const [modifiedCustomers, setModifiedCustomers] = useState<{ [key: string]: CustomerRole }>({})
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // Filter customers based on search text
  const filteredCustomers = useMemo(() => {
    if (!Array.isArray(customers)) return [];

    const trimmedSearch = searchText?.trim()?.toLowerCase();
    if (!trimmedSearch) return customers;

    return customers.filter((customer) => {
      if (!customer) return false;

      const name = customer.name?.toLowerCase() || "";
      const mobile = String(customer.mobile || "").toLowerCase();
      const dairy = customer.dailryName?.toLowerCase() || "";
      const id = customer.id?.toLowerCase() || "";

      return (
        name.includes(trimmedSearch) ||
        mobile.includes(trimmedSearch) ||
        dairy.includes(trimmedSearch) ||
        id.includes(trimmedSearch)
      );
    });
  }, [customers, searchText]);


  useFocusEffect(
    useCallback(() => {
      setModifiedCustomers({})
      setHasChanges(false)
    }, []),
  )

  // Handle role filter change
  const handleRoleFilter = useCallback((role: CustomerRole | "All") => {
    setSelectedRole(role)
    // Reset search when changing filters
    setSearchText("")
  }, [])

  // Handle search
  const handleSearch = useCallback((text: string) => {
    setSearchText(text)
  }, [])


  const handleRoleChange = useCallback(
    (customerId: string, newRole: CustomerRole) => {
      const customer = customers.find((c) => c._id === customerId)
      if (!customer) return

      setModifiedCustomers((prev) => {
        const currentModifiedRole = prev[customerId]
        const originalRole = customer.role

        // If clicking the same role that's already modified, remove the modification
        if (currentModifiedRole === newRole) {
          const { [customerId]: removed, ...rest } = prev
          const hasRemainingChanges = Object.keys(rest).length > 0
          setHasChanges(hasRemainingChanges)
          return rest
        }

        // If clicking the original role, remove the modification
        if (originalRole === newRole && currentModifiedRole) {
          const { [customerId]: removed, ...rest } = prev
          const hasRemainingChanges = Object.keys(rest).length > 0
          setHasChanges(hasRemainingChanges)
          return rest
        }

        // Otherwise, set the new role
        setHasChanges(true)
        return {
          ...prev,
          [customerId]: newRole,
        }
      })
    },
    [customers],
  )

  // Get current role for a customer (modified or original)
  const getCurrentRole = useCallback(
    (customer: Customer): CustomerRole => {
      return modifiedCustomers[customer._id] || customer.role
    },
    [modifiedCustomers],
  )

  // Save changes via API
  const handleSaveChanges = useCallback(async () => {
    if (!hasChanges) return

    setIsSaving(true)
    try {
      const updates = Object.entries(modifiedCustomers).map(([customerId, role]) => ({
        customerId,
        role,
      }))

      const response = await fetch(`${api.changeRole}`, {
        method: "POST",
        body: JSON.stringify({ users: JSON.stringify(updates) }),
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()
      if (data.success) {
        Toast.show({
          type: "success",
          text1: data.message,
        })
        setModifiedCustomers({})
        setHasChanges(false)
        refresh()
      } else {
        Alert.alert("Error", data.message)
      }
    } catch (error) {
      console.error("Failed to update customer roles:", error)
      const errorMessage =
        typeof error === "object" && error !== null && "message" in error && typeof (error as any).message === "string"
          ? (error as any).message
          : "Failed to save changes"
      Alert.alert("Error", errorMessage)
    } finally {
      setIsSaving(false)
    }
  }, [modifiedCustomers, hasChanges, refresh, token])

  // Cancel all changes
  const handleCancelChanges = useCallback(() => {
    Alert.alert("Cancel Changes", "Are you sure you want to discard all changes?", [
      {
        text: "Keep Editing",
        style: "cancel",
      },
      {
        text: "Discard",
        style: "destructive",
        onPress: () => {
          setModifiedCustomers({})
          setHasChanges(false)
        },
      },
    ])
  }, [])

  // Render role checkbox
  const renderRoleCheckbox = (customer: Customer, role: CustomerRole, label: string) => {
    const currentRole = getCurrentRole(customer)
    const isSelected = currentRole === role
    const isModified = modifiedCustomers[customer._id] === role
    const isOriginalRole = customer.role === role
    const canRemoveModification = isModified || (isOriginalRole && modifiedCustomers[customer._id])

    return (

      <RoleCheckBox
        handleRoleChange={() => handleRoleChange(customer._id, role)}
        isSelected={isSelected}
        isModified={isModified}
        canRemoveModification={canRemoveModification}
        label={label}
      />

    )
  }

  const renderCustomerItem = ({
    item,
    index,
  }: {
    item: Customer
    index: number
  }) => {

    return (
      <Animated.View entering={FadeInDown.delay(index * 100).duration(600)} style={styles.customerCard}>
        <View style={styles.cardContent}>
          {/* Customer Info Section */}
          <View style={styles.customerInfoSection}>
            <View style={styles.leftSection}>
              <View style={styles.avatarContainer}>
                <Image source={{ uri: item.profilePic }} style={styles.avatar} />
                {item.isVerified && (
                  <View style={styles.verifiedBadge}>
                    <MaterialIcons name="verified" size={14} color="#4CAF50" />
                  </View>
                )}
              </View>
            </View>

            <View style={styles.middleSection}>
              <Text style={styles.customerName} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.customerId}>ID: {item.id}</Text>
              <View style={styles.infoRow}>
                <MaterialIcons name="phone" size={14} color="#64748b" />
                <Text style={styles.infoText}>{item.mobile}</Text>
              </View>
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="cow" size={14} color="#64748b" />
                <Text style={styles.infoText} numberOfLines={1}>
                  {item.dailryName}
                </Text>
              </View>
            </View>

            {item.role === "Buyer" && <TouchableOpacity
              style={styles.detailsButton}
              onPress={() => setBuyerRateModalVisible(item)}
              activeOpacity={0.7}
            >
              <Feather name="edit" size={18} color="#3b82f6" />
            </TouchableOpacity>}
          </View>

          {/* Role Selection Section */}
          <View style={styles.roleSection}>
            <Text style={styles.roleSectionTitle}>Role Assignment</Text>
            <View style={styles.roleCheckboxes}>
              {renderRoleCheckbox(item, "User", "User")}
              {renderRoleCheckbox(item, "Farmer", "Farmer")}
              {renderRoleCheckbox(item, "Buyer", "Buyer")}
            </View>
          </View>
        </View>
      </Animated.View>
    )
  }

  if (loading) {
    return <DairyLoadingScreen loading={loading} loadingText="Syncing your Customer data..." />
  }





  return (
    <View style={styles.container}>
      <UsersHeader onRoleFilter={handleRoleFilter} onSearch={handleSearch} selectedRole={selectedRole} setCreateUserModalVisible={setCreateUserModalVisible} createUserModalVisible={createUserModalVisible} />

      {hasChanges && (
        <Animated.View entering={FadeInDown.duration(300)} style={styles.saveHeader}>
          <View style={styles.saveHeaderContent}>
            <View style={styles.changesInfo}>
              <MaterialIcons name="edit" size={16} color="#f59e0b" />
              <Text style={styles.changesText}>{Object.keys(modifiedCustomers).length} modified</Text>
            </View>
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancelChanges} activeOpacity={0.8}>
                <MaterialIcons name="close" size={16} color="#ef4444" />
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
                onPress={handleSaveChanges}
                disabled={isSaving}
                activeOpacity={0.8}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <MaterialIcons name="save" size={18} color="#ffffff" />
                )}
                <Text style={styles.saveButtonText}>{isSaving ? "Saving..." : "Save"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      )}

      {/* Results info */}
      <View style={styles.resultsInfo}>
        <Text style={styles.resultsText}>
          {searchText
            ? `${filteredCustomers.length} results for "${searchText}"`
            : `${filteredCustomers.length} ${selectedRole === "All" ? "users" : selectedRole.toLowerCase() + "s"} found`}
        </Text>
      </View>

      <FlatList
        data={filteredCustomers}
        renderItem={renderCustomerItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={[styles.listContainer, hasChanges && styles.listContainerWithHeader]}
        refreshControl={
          <RefreshControl onRefresh={refresh} refreshing={refreshing} colors={["#3b82f6"]} tintColor="#3b82f6" />
        }
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="search-off" size={48} color="#94a3b8" />
            <Text style={styles.emptyTitle}>No users found</Text>
            <Text style={styles.emptySubtitle}>
              {searchText
                ? "Try adjusting your search terms"
                : `No ${selectedRole === "All" ? "users" : selectedRole.toLowerCase() + "s"} available`}
            </Text>
          </View>
        )}
      />

      <CreateUserModal
        visible={createUserModalVisible}
        onClose={() => setCreateUserModalVisible(false)}
        onUserCreated={() => refresh()}
      />
      <BuyerRateConfigModal
        visible={buyerRateModalVisible}
        onClose={() => setBuyerRateModalVisible(null)}
        onBuyerSet={() => refresh()}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  saveHeader: {
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  saveHeaderContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  changesInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  changesText: {
    marginLeft: 6,
    fontSize: 14,
    color: "#f59e0b",
    fontWeight: "500",
  },
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  cancelButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef2f2",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  cancelButtonText: {
    color: "#ef4444",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 4,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3b82f6",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    backgroundColor: "#94a3b8",
  },
  saveButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
  resultsInfo: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  resultsText: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
  },
  listContainer: {
    padding: 16,
  },
  listContainerWithHeader: {
    paddingTop: 8,
  },
  separator: {
    height: 12,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
  },
  customerCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardContent: {
    padding: 16,
  },
  customerInfoSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  leftSection: {
    marginRight: 12,
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: "#e2e8f0",
  },
  verifiedBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 2,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  middleSection: {
    flex: 1,
    marginRight: 12,
  },
  customerName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 4,
  },
  customerId: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 8,
    fontWeight: "500",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: "#64748b",
    marginLeft: 8,
    flex: 1,
  },
  detailsButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#eff6ff",
  },
  roleSection: {
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingTop: 16,
  },
  roleSectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
  },
  roleCheckboxes: {
    flexDirection: "row",
    justifyContent: "space-between",
  }
})

export default ImprovedCustomersList
