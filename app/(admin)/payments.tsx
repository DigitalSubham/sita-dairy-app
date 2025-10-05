import PaymentForm from '@/components/admin/payment/paymentForm';
import { PaymentHeader } from '@/components/common/HeaderVarients';
import { api } from '@/constants/api';
import { FontAwesome } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from "@react-native-community/datetimepicker";
import { format } from 'date-fns';
import { useLocalSearchParams } from 'expo-router';
import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  type ListRenderItem,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';


// Types
type PaymentStatus = 'Paid' | 'Recieve';
type PaymentMethod = 'cash' | 'online';

interface PaymentRequest {
  _id: string;
  toUser: User;
  userId: string;
  name: string;
  profilePic: string;
  amount: number;
  date: string;
  paymentType: 'Paid' | 'Recieved';
  transactionId?: string;
  paymentMethod?: PaymentMethod;
}

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
  amount: string
  date: string

}

interface TabButtonProps {
  tabName: PaymentStatus;
  label: string;
  activeTab: PaymentStatus;
  onPress: (tabName: PaymentStatus) => void;
  disabled: boolean;
}

export default function PaymentRequestsScreen(): React.ReactElement {
  const { defaultTab } = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState<PaymentStatus>('Paid');
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showPaymentMethodModal, setShowPaymentMethodModal] =
    useState<boolean>(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string>("");

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const storedToken = await AsyncStorage.getItem("token");
        setToken(storedToken ? JSON.parse(storedToken) : "");
      } catch {
        setError("Failed to load auth token");
        setLoading(false);
      }
    };
    fetchToken();
  }, []);

  // Fetch payment requests based on active tab
  useEffect(() => {
    if (token && date && activeTab) {
      fetchPaymentRequests(activeTab);
    }
  }, [activeTab, token, date]);


  useEffect(() => {
    if (typeof defaultTab === 'string') {
      if (['Paid', 'Recieve'].includes(defaultTab)) {
        setActiveTab(defaultTab as PaymentStatus);
      }
    }
  }, [defaultTab]);

  const fetchPaymentRequests = async (status: PaymentStatus): Promise<void> => {
    if (!token) return;
    setLoading(true);
    try {

      const response = await fetch(api.getPaymentsReport, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          code: status,
          date: date, // fetch all records
        }),
      });
      const data = await response.json();
      if (data.success) {
        setPaymentRequests(data.data);
      } else {
        setPaymentRequests([]);
      }
    } catch (error) {
      console.error('Error fetching payment requests:', error);
      Alert.alert('Error', 'Failed to load payment requests');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

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
    setShowDatePicker(false)
    if (selectedDate) {
      const dateString = format(selectedDate, "yyyy-MM-dd")
      setDate(dateString)
    }
  }

  const renderPaymentRequest: ListRenderItem<PaymentRequest> = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Image source={{ uri: item.toUser.profilePic }} style={styles.profilePic} />
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.toUser.name}</Text>
          <Text style={styles.userId}>ID: {item?.toUser?.id}</Text>
          <Text style={styles.upiId}>DATE: {format(item?.date, "dd-MM-yyyy")}</Text>
        </View>
        <View style={styles.amountContainer}>
          <Text style={styles.amountLabel}>Amount</Text>
          <Text style={styles.amount}>₹{item?.amount}</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.statusContainer}>
          <View
            style={[
              styles.statusIndicator,
              item?.paymentType === 'Paid' && styles.approvedStatus,
              item?.paymentType === 'Recieved' && styles.pendingStatus,
            ]}
          />
          <Text style={styles.statusText}>
            {item.paymentType.charAt(0).toUpperCase() + item.paymentType.slice(1)}
          </Text>
          {item?.transactionId && (
            <Text style={styles.transactionId}>TXN: {item?.transactionId}</Text>
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
        addNewProduct={() => { setShowPaymentMethodModal(true); }}
      />

      <View style={styles.tabContainer}>
        {renderTabButton('Paid', 'Paid')}
        {renderTabButton('Recieve', 'Recieved')}
        <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.compactField}>
          <FontAwesome name="calendar" size={14} color="#0284c7" />
          <Text style={styles.compactFieldText}>{format(new Date(date), "dd/MM")}</Text>
        </TouchableOpacity>
      </View>


      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loaderText}>Loading payment requests...</Text>
        </View>
      ) : paymentRequests?.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No payment requests found</Text>
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
              colors={['#007AFF']}
            />
          }
        />
      )}

      {/* Payment Method Selection Modal */}

      <PaymentForm showPaymentMethodModal={showPaymentMethodModal} setShowPaymentMethodModal={setShowPaymentMethodModal} fetchPaymentRequests={fetchPaymentRequests} />
      {showDatePicker && (
        <DateTimePicker
          value={new Date(date)}
          mode="date"
          display="default"
          onChange={onDateChange}
          maximumDate={new Date()}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#d9dee6ff',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#374151',
  },
  activeTabButton: {
    backgroundColor: '#6366f1',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#d1d5db',
  },
  activeTabButtonText: {
    color: '#ffffff',
  },
  listContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
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
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 2,
  },
  userId: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 2,
  },
  upiId: {
    fontSize: 12,
    color: '#9ca3af',
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amountLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 2,
  },
  amount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  approvedStatus: {
    backgroundColor: '#10b981',
  },
  pendingStatus: {
    backgroundColor: '#f59e0b',
  },
  rejectedStatus: {
    backgroundColor: '#ef4444',
  },
  statusText: {
    fontSize: 14,
    color: '#d1d5db',
    marginRight: 8,
  },
  transactionId: {
    fontSize: 12,
    color: '#9ca3af',
    marginRight: 8,
  },
  paymentMethod: {
    fontSize: 12,
    color: '#9ca3af',
  },
  actionButtons: {
    flexDirection: 'row',
  },
  actionButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginLeft: 8,
  },
  approveButton: {
    backgroundColor: '#10b981',
  },
  rejectButton: {
    backgroundColor: '#ef4444',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 12,
    fontSize: 16,
    color: '#d1d5db',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
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

});
