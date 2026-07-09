import Constants from "expo-constants";

const BASE_URL = Constants?.expoConfig?.extra?.apiUrl ?? "";
export const api = {
  login: `${BASE_URL}/user/login`,
  signup: `${BASE_URL}/user/create`,
  dashboard: `${BASE_URL}/user/dashboard`,
  changePosition: `${BASE_URL}/user/change-position`,
  milkEntry: `${BASE_URL}/milk/create`,
  updateMilkEntry: `${BASE_URL}/milk/update`,
  milkSales: `${BASE_URL}/milk/sell`,
  getUser: `${BASE_URL}/user/getSingleCustomerDetail`,
  updateUser: `${BASE_URL}/user/update`,

  getRecords: `${BASE_URL}/milk/get`,

  getAllCustomers: `${BASE_URL}/user/all-customers`,
  dropdownUsers: `${BASE_URL}/general/dropdown`,
  deleteRecord: `${BASE_URL}/milk/delete`,
  deleteAccount: `${BASE_URL}/user/delete-account`,
  changeRole: `${BASE_URL}/user/change-user-role`,

  // products
  getProducts: `${BASE_URL}/product/all`,
  createProduct: `${BASE_URL}/product/create`,
  updateProduct: `${BASE_URL}/product/update`,
  deleteProduct: `${BASE_URL}/product/delete`,

  // payments (legacy — not implemented on the backend, kept until callers are migrated)
  createPayment: `${BASE_URL}/payment/add-payment`,
  getPaymentsReport: `${BASE_URL}/payment/payment-report`,
  resetPayments: `${BASE_URL}/payment/reset-payment`,

  // wallet
  walletStatement: `${BASE_URL}/wallet/statement`,
  walletCashPayment: `${BASE_URL}/wallet/cash-payment`,
  walletTopupInitiate: `${BASE_URL}/wallet/upi-topup/initiate`,
  walletTopupReverify: `${BASE_URL}/wallet/upi-topup`,

  rateChart: `${BASE_URL}/ratechart`,
};
