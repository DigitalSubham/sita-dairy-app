import PaymentForm from "@/components/admin/payment/paymentForm";
import FilterChip from "@/components/common/Chips";
import { PaymentHeader } from "@/components/common/HeaderVarients";
import UserModal from "@/components/common/UserModal";
import DairyLoadingScreen from "@/components/Loading";
import { api } from "@/constants/api";
import { CustomerRole, FormData, PaymentRequest, PaymentStatus, PaymentType, TabButtonProps, User } from "@/constants/types";
import useCustomers from "@/hooks/useCustomer";
import { fetchData } from "@/utils/services";
import DateTimePicker from "@react-native-community/datetimepicker";
import { format } from "date-fns";
import { useFocusEffect, useLocalSearchParams, useNavigation } from "expo-router";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FlatList,
  Image,
  type ListRenderItem,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";




export default function PaymentRequestsScreen(): React.ReactElement {
  const { defaultTab } = useLocalSearchParams();
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<PaymentStatus>(PaymentType.Paid);
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [showPaymentMethodModal, setShowPaymentMethodModal] =
    useState<boolean>(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [formData, setFormData] = useState<FormData>({
    userId: "",
    date: format(new Date(), "yyyy-MM-dd"),
    role: "Farmer",
    amount: "",
  });
  const derivedRole: CustomerRole =
    formData.role === "Customer" || activeTab === PaymentType.Receive
      ? "Buyer"
      : "Farmer";

  const { customers, token } = useCustomers({
    role: derivedRole
  });
  const [showUserSelector, setShowUserSelector] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const navigation = useNavigation()
  const updateFormData = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Fetch payment requests based on active tab
  useEffect(() => {
    if (date && activeTab) {
      fetchPaymentRequests(activeTab);
    }
  }, [activeTab, date, selectedUser]);

  useEffect(() => {
    if (typeof defaultTab === "string") {
      if (["Paid", "Recieve"].includes(defaultTab)) {
        setActiveTab(defaultTab as PaymentStatus);
      }
    }
  }, [defaultTab]);

  useFocusEffect(
    useCallback(() => {
      // reset filters
      setDate(format(new Date(), "yyyy-MM-dd"));
      setSelectedUser(null);
      fetchPaymentRequests(activeTab);
    }, [])
  );


  const fetchPaymentRequests = useCallback(async (status: PaymentStatus): Promise<void> => {
    if (showPaymentMethodModal) return;
    const payload: { code: PaymentStatus; date: string; userId?: string } = {
      code: status,
      date: date, // fetch all records
      userId: selectedUser ? selectedUser._id : undefined,
    };
    await fetchData({
      apiUrl: api.getPaymentsReport,
      setLoading,
      setRefreshing,
      setData: setPaymentRequests,
      extractData: (res) => (res.success && res.data ? res.data : []),
      navigation,
      payload,
      method: "POST",
    });
  }, [token, date, selectedUser, showPaymentMethodModal]);

  const TabButton: React.FC<TabButtonProps> = ({
    tabName,
    label,
    activeTab,
    onPress,
    disabled,
  }) => (
    <TouchableOpacity
      style={[
        styles.tabButton,
        activeTab === tabName && styles.activeTabButton,
      ]}
      onPress={() => onPress(tabName)}
      disabled={disabled}
    >
      <Text
        style={[
          styles.tabButtonText,
          activeTab === tabName && styles.activeTabButtonText,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderTabButton = (
    tabName: PaymentStatus,
    label: string
  ): React.ReactElement => (
    <TabButton
      tabName={tabName}
      label={label}
      activeTab={activeTab}
      onPress={setActiveTab}
      disabled={loading}
    />
  );

  // Handle date picker change
  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const dateString = format(selectedDate, "yyyy-MM-dd");
      setDate(dateString);
    }
  };

  const renderPaymentRequest: ListRenderItem<PaymentRequest> = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Image
          source={{
            uri:
              activeTab === "Paid"
                ? item.toUser.profilePic
                : item.fromUser.profilePic,
          }}
          style={styles.profilePic}
        />
        <View style={styles.userInfo}>
          <Text style={styles.userName}>
            {activeTab === "Paid" ? item.toUser.name : item.fromUser.name}
          </Text>
          <Text style={styles.userId}>
            ID: {activeTab === "Paid" ? item?.toUser?.id : item?.fromUser?.id}
          </Text>
          <Text style={styles.upiId}>
            DATE: {format(new Date(item?.date), "dd-MM-yyyy")}
          </Text>
        </View>
        <View style={styles.amountContainer}>
          <Text style={styles.amountLabel}>{t("common.amount")}</Text>
          <Text style={styles.amount}>₹{item?.amount}</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.statusContainer}>
          <View
            style={[
              styles.statusIndicator,
              item?.paymentType === "Paid" && styles.approvedStatus,
              item?.paymentType === PaymentType.Receive && styles.pendingStatus,
            ]}
          />
          <Text style={styles.statusText}>
            {item.paymentType.charAt(0).toUpperCase() +
              item.paymentType.slice(1)}
          </Text>
          {item?.transactionId && (
            <Text style={styles.transactionId}>{t("common.transaction")}: {item?.transactionId}</Text>
          )}
          {item?.paymentMethod && (
            <Text style={styles.paymentMethod}>
              (
              {item?.paymentMethod.charAt(0).toUpperCase() +
                item?.paymentMethod.slice(1)}
              )
            </Text>
          )}
        </View>
      </View>
    </View>
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPaymentRequests(activeTab);
  }, [token, activeTab]);

  return (
    <SafeAreaView style={styles.container}>
      <PaymentHeader
        addNewProduct={() => {
          setShowPaymentMethodModal(true);
          setFormData((prev) => ({ ...prev, role: activeTab === PaymentType.Receive ? "Customer" : "Farmer" }));
        }}
      />
      <View style={styles.tabContainer}>
        {renderTabButton(PaymentType.Paid, "Paid")}
        {renderTabButton(PaymentType.Receive, "Recieved")}
        <FilterChip
          title={selectedUser ? selectedUser.name.split(" ")[0] ?? "User" : activeTab === PaymentType.Receive ? "Buyer" : "Farmer"}
          isActive={!!selectedUser}
          onPress={() => setShowUserSelector(true)}
          icon="person"
        />
        <FilterChip
          title={date ? format(new Date(date), "dd MMM") : "Date"}
          isActive={!!date}
          onPress={() => {
            setShowDatePicker(true);
          }}
          icon="today"
        />
      </View>
      {loading ? (
        <DairyLoadingScreen loading loadingText="Loading payments..." />
      ) : paymentRequests?.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{t("common.no_results_found")}</Text>
        </View>
      ) : (
        <FlatList
          data={paymentRequests}
          renderItem={renderPaymentRequest}
          keyExtractor={(item: PaymentRequest) => item._id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#ffffff"
              colors={["#007AFF"]}
            />
          }
        />
      )}
      {/* Payment Method Selection Modal */}
      <PaymentForm
        showPaymentMethodModal={showPaymentMethodModal}
        setShowPaymentMethodModal={setShowPaymentMethodModal}
        fetchPaymentRequests={fetchPaymentRequests}
        token={token}
        formData={formData}
        setFormData={setFormData}
        selectedUser={selectedUser}
        setSelectedUser={setSelectedUser}
        setShowUserSelector={setShowUserSelector}

      />
      {showDatePicker && (
        <DateTimePicker
          value={new Date(date)}
          mode="date"
          display="default"
          onChange={onDateChange}
          maximumDate={new Date()}
        />
      )}
      {
        <UserModal
          title={formData.role || (activeTab === PaymentType.Receive ? "Buyer" : "Farmer")}
          showUserSelector={showUserSelector}
          setShowUserSelector={setShowUserSelector}
          filteredUser={customers}
          selectedUser={selectedUser}
          setSelectedUser={setSelectedUser}
          updateFormData={updateFormData}
        />
      }
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#d9dee6ff",
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: "#374151",
  },
  activeTabButton: {
    backgroundColor: "#6366f1",
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#d1d5db",
  },
  activeTabButtonText: {
    color: "#ffffff",
  },
  listContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: "#1f2937",
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  profilePic: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 2,
  },
  userId: {
    fontSize: 12,
    color: "#9ca3af",
    marginBottom: 2,
  },
  upiId: {
    fontSize: 12,
    color: "#9ca3af",
  },
  amountContainer: {
    alignItems: "flex-end",
  },
  amountLabel: {
    fontSize: 12,
    color: "#9ca3af",
    marginBottom: 2,
  },
  amount: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#374151",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  approvedStatus: {
    backgroundColor: "#10b981",
  },
  pendingStatus: {
    backgroundColor: "#0b8cf5ff",
  },
  rejectedStatus: {
    backgroundColor: "#ef4444",
  },
  statusText: {
    fontSize: 14,
    color: "#d1d5db",
    marginRight: 8,
  },
  transactionId: {
    fontSize: 12,
    color: "#9ca3af",
    marginRight: 8,
  },
  paymentMethod: {
    fontSize: 12,
    color: "#9ca3af",
  },
  actionButtons: {
    flexDirection: "row",
  },
  actionButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginLeft: 8,
  },
  approveButton: {
    backgroundColor: "#10b981",
  },
  rejectButton: {
    backgroundColor: "#ef4444",
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loaderText: {
    marginTop: 12,
    fontSize: 16,
    color: "#d1d5db",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#9ca3af",
  },
});
