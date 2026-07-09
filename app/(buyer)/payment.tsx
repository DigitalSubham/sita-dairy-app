import AddAmountModal, { TopupResult } from '@/components/buyer/AddAmountModal';
import { CustomHeader } from '@/components/common/CustomHeader';
import { api } from '@/constants/api';
import { AlertConfig, AlertType, CustomAlertProps, WalletTransaction } from '@/constants/types';
import { walletSourceLabel, walletStatusColor } from '@/utils/helper';
import { Entypo, Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';
import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type TextStyle,
  type ViewStyle
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';




// Custom Alert Component
const CustomAlert: React.FC<CustomAlertProps> = ({
  visible,
  title,
  message,
  onClose,
  type = 'info',
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 50,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, fadeAnim, slideAnim]);

  if (!visible) return null;

  const getIconColor = (): string => {
    switch (type) {
      case 'success':
        return '#10B981';
      case 'error':
        return '#EF4444';
      default:
        return '#3B82F6';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <Feather name='trending-up' size={24} color={getIconColor()} />;
      case 'error':
        return <Feather name='alert-circle' size={24} color={getIconColor()} />;
      default:
        return <Feather name='alert-circle' size={24} color={getIconColor()} />;
    }
  };

  return (
    <View style={styles.alertOverlay}>
      <Animated.View
        style={[
          styles.alertContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.alertIconContainer}>{getIcon()}</View>
        <Text style={styles.alertTitle}>{title}</Text>
        <Text style={styles.alertMessage}>{message}</Text>
        <TouchableOpacity
          style={[styles.alertButton, { backgroundColor: getIconColor() }]}
          onPress={onClose}
        >
          <Text style={styles.alertButtonText}>OK</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const WALLET_PAGE_LIMIT = 20;

const WalletModal: React.FC = () => {
  const [token, setToken] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [addAmountVisible, setAddAmountVisible] = useState<boolean>(false);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [alertVisible, setAlertVisible] = useState<boolean>(false);
  const [alertConfig, setAlertConfig] = useState<AlertConfig>({
    title: '',
    message: '',
    type: 'info',
  });
  const { t } = useTranslation()
  const showAlert = (
    title: string,
    message: string,
    type: AlertType = 'info'
  ): void => {
    setAlertConfig({ title, message, type });
    setAlertVisible(true);
  };

  // Animation values
  const balanceScale = useRef(new Animated.Value(1)).current;

  const hideAlert = (): void => {
    setAlertVisible(false);
  };

  const handleTopupResult = (result: TopupResult, amount: number): void => {
    if (result === 'Success') {
      showAlert(
        t('payments.payment_successful'),
        t('payments.payment_successful_message', { amount }),
        'success'
      );
    } else if (result === 'Pending') {
      showAlert(
        t('payments.payment_pending'),
        t('payments.payment_pending_message'),
        'info'
      );
    } else {
      showAlert(
        t('payments.payment_failed'),
        t('payments.payment_failed_message'),
        'error'
      );
    }
    fetchData();
  };

  const handleVerify = async (transaction: WalletTransaction): Promise<void> => {
    const merchantOrderId = transaction.gateway?.merchantOrderId;
    if (!token || !merchantOrderId || verifyingId) return;

    setVerifyingId(transaction._id);
    try {
      const response = await fetch(
        `${api.walletTopupReverify}/${merchantOrderId}/reverify`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      if (data.success) {
        handleTopupResult(data.data?.status === 'Success' ? 'Success' : data.data?.status === 'Failed' ? 'Failed' : 'Pending', transaction.amount);
      } else {
        showAlert(
          t('payments.payment_failed'),
          data.message || t('payments.topup_failed_to_start'),
          'error'
        );
      }
    } catch (error) {
      showAlert(
        t('payments.payment_failed'),
        t('payments.topup_failed_to_start'),
        'error'
      );
    } finally {
      setVerifyingId(null);
    }
  };

  const fetchData = async (): Promise<void> => {
    if (!token) return;
    setIsLoading(true);

    try {
      const [userResponse, statementResponse] = await Promise.all([
        fetch(api.getUser, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }),
        fetch(`${api.walletStatement}?limit=${WALLET_PAGE_LIMIT}&page=1`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }),
      ]);

      const userData = await userResponse.json();
      if (userData.success) {
        setWalletBalance(userData.user?.walletAmount ?? 0);
      }

      const statementData = await statementResponse.json();
      if (statementData.success) {
        setTransactions(statementData.data);
        setTotalCount(statementData.totalCount ?? statementData.data.length);
        setPage(1);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      showAlert(
        'Connection Error',
        'Failed to fetch your wallet data. Please try again.',
        'error'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const loadMoreTransactions = async (): Promise<void> => {
    if (!token || isLoadingMore || transactions.length >= totalCount) return;

    setIsLoadingMore(true);
    try {
      const nextPage = page + 1;
      const response = await fetch(
        `${api.walletStatement}?limit=${WALLET_PAGE_LIMIT}&page=${nextPage}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      if (data.success) {
        setTransactions((prev) => [...prev, ...data.data]);
        setTotalCount(data.totalCount ?? totalCount);
        setPage(nextPage);
      }
    } catch (error) {
      showAlert(
        'Connection Error',
        'Failed to load more transactions. Please try again.',
        'error'
      );
    } finally {
      setIsLoadingMore(false);
    }
  };

  const onRefresh = useCallback(async (): Promise<void> => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [token]);

  useEffect(() => {
    const fetchToken = async (): Promise<void> => {
      const storedToken = await AsyncStorage.getItem('token');
      setToken(storedToken ? JSON.parse(storedToken) : '');
    };
    fetchToken();
  }, []);

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      if (token) {
        fetchData();
      }
    }, [token])
  );

  const renderTransactionList = () => {
    if (isLoading) {
      return (
        <View style={styles.emptyStateContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.emptyStateText}>{t("payments.loading_transactions")}...</Text>
        </View>
      );
    }

    if (transactions.length === 0) {
      return (
        <ScrollView
          contentContainerStyle={styles.emptyStateContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#ffffff"
              colors={['#4A00E0', '#8E2DE2']}
              progressBackgroundColor="#1e293b"
            />
          }
        >
          <Feather name='alert-circle' size={48} color="#9CA3AF" />
          <Text style={styles.emptyStateText}>{t("payments.no_transactions_found")}</Text>
        </ScrollView>
      );
    }

    return (
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#ffffff"
            colors={['#4A00E0', '#8E2DE2']}
            progressBackgroundColor="#1e293b"
          />
        }
      >
        <View style={styles.transactionList}>
          {transactions.map((transaction, index) => {
            const isCredit = transaction.direction === 'Credit';
            const statusColor = walletStatusColor(transaction.status, isCredit);
            const canVerify =
              transaction.source === 'Top-up' &&
              transaction.status === 'Pending' &&
              !!transaction.gateway?.merchantOrderId;
            return (
              <Animated.View
                key={transaction._id}
                style={[
                  styles.transactionItem,
                  index === transactions.length - 1 && { borderBottomWidth: 0 },
                ]}
              >
                <View
                  style={[
                    styles.transactionIcon,
                    { backgroundColor: `${statusColor}26` },
                  ]}
                >
                  <Feather
                    name={
                      transaction.status === 'Pending'
                        ? 'clock'
                        : transaction.status === 'Failed'
                          ? 'x-circle'
                          : isCredit ? 'trending-up' : 'trending-down'
                    }
                    size={20}
                    color={statusColor}
                  />
                </View>
                <View style={styles.transactionContent}>
                  <Text style={{ color: "white" }}>{walletSourceLabel(transaction.source)}</Text>
                  <Text style={styles.transactionDate}>
                    {format(new Date(transaction.createdAt), 'MMM d, yyyy')}
                    {transaction.status !== 'Success' ? (
                      <Text style={{ color: statusColor }}> • {transaction.status}</Text>
                    ) : ''}
                  </Text>
                  {!!transaction.note && (
                    <Text style={styles.transactionNote} numberOfLines={2}>
                      {transaction.note}
                    </Text>
                  )}
                  {canVerify && (
                    <TouchableOpacity
                      style={styles.verifyButton}
                      onPress={() => handleVerify(transaction)}
                      disabled={verifyingId === transaction._id}
                    >
                      {verifyingId === transaction._id ? (
                        <ActivityIndicator size="small" color="#F59E0B" />
                      ) : (
                        <>
                          <Feather name="refresh-cw" size={12} color="#F59E0B" />
                          <Text style={styles.verifyButtonText}>{t('payments.verify')}</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
                <Text style={[styles.transactionAmount, { color: statusColor }]}>
                  {isCredit ? '+' : '-'}₹{transaction.amount}
                </Text>
              </Animated.View>
            );
          })}
        </View>

        {transactions.length < totalCount && (
          <TouchableOpacity
            style={styles.loadMoreButton}
            onPress={loadMoreTransactions}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? (
              <ActivityIndicator size="small" color="#3B82F6" />
            ) : (
              <Text style={styles.loadMoreText}>{t("payments.load_more")}</Text>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>
    );
  };

  // Balance card press animation
  const onBalanceCardPress = (): void => {
    Animated.sequence([
      Animated.timing(balanceScale, {
        toValue: 0.98,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(balanceScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <SafeAreaView style={styles.container}>
      <CustomHeader title={t("navigation.payments")} />

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#ffffff"
            colors={['#4A00E0', '#8E2DE2']}
            progressBackgroundColor="#1e293b"
          />
        }
      >
        <Animated.View style={{ transform: [{ scale: balanceScale }] }}>
          <TouchableOpacity activeOpacity={0.95} onPress={onBalanceCardPress}>
            <LinearGradient
              colors={['#4F46E5', '#3B82F6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.balanceCard}
            >
              <View style={styles.balanceHeader}>
                <View>
                  <Text style={styles.balanceLabel}>{t("payments.wallet_balance")}</Text>
                  <Text style={styles.balanceAmount}>
                    ₹{walletBalance.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.walletIconContainer}>
                  <Entypo name="wallet" size={20} color="#FFFFFF" />
                </View>
              </View>
              <TouchableOpacity
                style={styles.addAmountButton}
                activeOpacity={0.85}
                onPress={() => setAddAmountVisible(true)}
              >
                <Feather name="plus-circle" size={16} color="#4F46E5" />
                <Text style={styles.addAmountButtonText}>{t('payments.add_amount')}</Text>
              </TouchableOpacity>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
        <View style={styles.transSection}>
          <Text style={styles.sectionTitle}>{t("payments.transaction_history")}</Text>
        </View>
        {renderTransactionList()}
      </ScrollView>

      <CustomAlert
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={hideAlert}
      />

      <AddAmountModal
        visible={addAmountVisible}
        onClose={() => setAddAmountVisible(false)}
        token={token}
        onResult={handleTopupResult}
      />
    </SafeAreaView>
  );
};

const { width } = Dimensions.get('window');

interface Styles {
  container: ViewStyle;
  header: ViewStyle;
  backButton: ViewStyle;
  headerTitle: TextStyle;
  content: ViewStyle;
  balanceCard: ViewStyle;
  balanceHeader: ViewStyle;
  walletIconContainer: ViewStyle;
  balanceLabel: TextStyle;
  balanceAmount: TextStyle;
  addAmountButton: ViewStyle;
  addAmountButtonText: TextStyle;

  sectionTitle: TextStyle;
  transactionList: ViewStyle;
  transactionItem: ViewStyle;
  transactionIcon: ViewStyle;
  transactionContent: ViewStyle;
  transactionDescription: TextStyle;
  transactionDate: TextStyle;
  transactionNote: TextStyle;
  transactionAmount: TextStyle;
  verifyButton: ViewStyle;
  verifyButtonText: TextStyle;
  emptyStateContainer: ViewStyle;
  emptyStateText: TextStyle;
  emptyStateButton: ViewStyle;
  emptyStateButtonText: TextStyle;
  loadMoreButton: ViewStyle;
  loadMoreText: TextStyle;
  alertOverlay: ViewStyle;
  alertContainer: ViewStyle;
  alertIconContainer: ViewStyle;
  alertTitle: TextStyle;
  alertMessage: TextStyle;
  alertButton: ViewStyle;
  alertButtonText: TextStyle;
  compactFieldText: TextStyle;
  compactField: ViewStyle;
  transSection: ViewStyle;
}

const styles = StyleSheet.create<Styles>({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  balanceCard: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 15,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  walletIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 8,
  },
  balanceLabel: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  balanceAmount: {
    fontWeight: '800',
    fontSize: 48,
    color: '#FFFFFF',
    marginBottom: 24,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 1,
  },
  addAmountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  addAmountButtonText: {
    color: '#4F46E5',
    fontWeight: '700',
    fontSize: 14,
  },

  sectionTitle: {
    fontWeight: '700',
    fontSize: 20,
    color: '#000',
    letterSpacing: 0.5,
  },
  transactionList: {
    backgroundColor: 'rgba(27, 33, 42, 0.8)',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  transactionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    backgroundColor:
      'rgba(255, 59, 48, 0.15)'
  },
  transactionContent: {
    flex: 1,
  },
  transactionDescription: {
    fontWeight: '600',
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  transactionNote: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginTop: 2,
  },
  verifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  verifyButtonText: {
    color: '#F59E0B',
    fontWeight: '600',
    fontSize: 12,
  },
  transactionAmount: {
    fontWeight: '700',
    fontSize: 16,
    color: '#FF3B30'
  },
  emptyStateContainer: {
    backgroundColor: 'rgba(31, 41, 55, 0.8)',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    minHeight: 300,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 16,
  },
  emptyStateButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  emptyStateButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  loadMoreButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginBottom: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  loadMoreText: {
    color: '#3B82F6',
    fontWeight: '600',
    fontSize: 14,
  },
  // Custom Alert Styles
  alertOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  alertContainer: {
    width: width * 0.85,
    backgroundColor: '#1F2937',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  alertIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  alertTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  alertMessage: {
    fontSize: 16,
    color: '#9CA3AF',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  alertButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  alertButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
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
  transSection: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }

});

export default WalletModal;
