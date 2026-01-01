export const LANGUAGE_KEY = "APP_LANGUAGE";

export enum ShiftType {
  Morning = "Morning",
  Evening = "Evening",
}

export enum MilkType {
  Cow = "Cow",
  Buffalo = "Buffalo",
}

export enum PaymentType {
  Paid = "Paid",
  Receive = "Receive",
}

export enum PaymentMethod {
  Cash = "cash",
  Online = "online",
}
export type AlertType = "info" | "success" | "error";
export type CustomerRole = "User" | "Farmer" | "Buyer" | "Customer";
export type stringNumber = string | number;

interface BaseMilkData {
  date: string;
  shift: ShiftType;
  weight: string;
  fat?: string;
  snf?: string;
  rate: string;
  price: string;
}

interface BaseUserRef {
  byUser: {
    _id: string;
    name: string;
    profilePic?: string;
  };
}

export interface BaseUser {
  _id: string;
  id: string;
  name: string;
  profilePic: string;
  mobile: string;
}

interface BaseTransaction {
  _id: string;
  date: string;
  amount: number;
  status: "completed" | "pending";
}

interface BaseDashboardData {
  totalTodaysMilk: number;
  totalMonthlyMilk: number;
}

export interface MilkEntry extends BaseMilkData, BaseUserRef {
  _id: string;
  milkType: MilkType;
  onEdit?: (item: MilkEntry) => void;
  onDelete?: (item: MilkEntry) => void;
}

export interface MilkRecord extends BaseMilkData, BaseUserRef {
  _id: string;
  createdAt: string;
  updatedAt: string;
}

export interface Customer extends BaseUser {
  isVerified: boolean;
  fatherName: string;
  dailryName: string;
  collectionCenter: string;
  createdAt: string;
  role: CustomerRole;
  morningMilk?: string;
  eveningMilk?: string;
  milkRate?: string;
  positionNo?: number;
}

export interface Farmer extends BaseUser {
  totalMilk: number;
  pendingAmount: number;
}

export interface User extends BaseUser {
  role?: string;
  collectionCenter?: string;
  milkRate?: string;
  morningMilk?: string;
  eveningMilk?: string;
}

export interface PaymentRequest extends BaseTransaction {
  toUser: User;
  fromUser: User;
  paymentType: PaymentType;
  transactionId?: string;
  paymentMethod?: PaymentMethod;
}

export interface Transaction extends BaseTransaction {
  byUser: Farmer;
  type: "payment" | "collection";
  rate: string;
  fat: string;
  snf: string;
  weight: string;
  farmerName: string;
  price: string;
  profilePic: string;
  shift: ShiftType;
}

export interface AdminDashboardData extends BaseDashboardData {
  totalCustomers: number;
  activeFarmers: number;
  totalMilkCollected: number;
  totalMilkSold: number;
  pendingPayments: number;
  milkWastage: number;
  inventoryValue: number;
  byUser: Farmer[];
  lastFiveEntries: Transaction[];
  milkInventory: MilkInventory[];
  collectionTrend: number[];
  collectionDates: string[];
}

export interface FarmerDashboardData extends BaseDashboardData {
  totalTodaysEarnings: number;
  monthlyEarning: number;
  todaysFatValues: number;
  todaysSnfValues: number;
  lastFiveEntries?: MilkCollection[];
  qualityTrend?: MilkQuality[];
}

export type AuthContextType = {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  signIn: (mobile: string, password: string) => Promise<any>;
  signUp: (name: string, mobile: string, role?: string) => Promise<any>;
  signOut: () => void;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (
    email: string,
    code: string,
    newPassword: string
  ) => Promise<void>;
};

export interface MilkInventory {
  date: string;
  morningCollection: number;
  eveningCollection: number;
  totalSold: number;
}

export interface MilkCollection {
  _id: string;
  date: string;
  weight: number;
  fat: number;
  snf: number;
  rate: number;
  price: number;
  shift: ShiftType;
}

export interface MilkQuality {
  fat: number;
  snf: number;
  date: string;
}

export type PaymentStatus = PaymentType;

export interface MilkEntryFormData {
  userId: string;
  weight: string;
  fat?: string;
  snf?: string;
  rate: string;
  date: string;
  shift: ShiftType;
  milkType: MilkType;
}

export interface RateChartRow {
  fat: number;
  snf8_0: number;
  snf8_1: number;
  snf8_2: number;
  snf8_3: number;
  snf8_4: number;
  snf8_5: number;
}

export interface TabButtonProps {
  tabName: PaymentStatus;
  label: string;
  activeTab: PaymentStatus;
  onPress: (tabName: PaymentStatus) => void;
  disabled: boolean;
}

export interface FormData {
  userId: string;
  amount: string;
  date: string;
  role: CustomerRole;
}

export interface Product {
  _id: string;
  title: string;
  price: number;
  description: string;
  thumbnail: string;
  isFeatured: boolean;
}

export interface ProductFormData {
  _id: string;
  title: string;
  price: string;
  description: string;
  thumbnail: string;
  isFeatured: boolean;
}

export interface Payment {
  _id: string | number;
  type: "earned" | "withdrawn" | "rejected";
  amount: number;
  description: string;
  date: Date;
}

// Custom Alert Props interface
export interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
  type?: AlertType;
}

// Alert configuration interface
export interface AlertConfig {
  title: string;
  message: string;
  type: AlertType;
}

export interface FilterParams {
  startDate?: string;
  endDate?: string;
  date?: string;
  userId?: string;
  shift?: ShiftType;
}

export interface UserState {
  _id?: string;
  id?: string;
  name?: string;
  mobile?: string;
  collectionCenter?: string;
  dailryName?: string;
  fatherName?: string;
  role?: string;
  isVerified?: boolean;
  profilePic?: string;
  createdAt?: string;
  address: string;
}
