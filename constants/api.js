import Constants from "expo-constants";

const BASE_URL = Constants.expoConfig.extra.apiUrl;

export const api = {
  login: `${BASE_URL}/user/login`,
  signup: `${BASE_URL}/user/create`,
  dashboard: `${BASE_URL}/user/dashboard`,
  milkEntry: `${BASE_URL}/milk/create`,
  milkSales: `${BASE_URL}/milk/sell`,
  getUser: `${BASE_URL}/user/getSingleCustomerDetail`,
  updateUser: `${BASE_URL}/user/update`,
  getRecords: `${BASE_URL}/milk/get`,
  getAllCustomers: `${BASE_URL}/user/all-customers`,
  deleteRecord: `${BASE_URL}/milk/delete`,
  deleteAccount: `${BASE_URL}/user/delete-account`,
  changeRole: `${BASE_URL}/user/change-user-role`,

  //
  products: `${BASE_URL}/milk/products`,
};
