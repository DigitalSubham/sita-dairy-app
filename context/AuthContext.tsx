import { api } from "@/constants/api";
import { AuthContextType, User } from "@/constants/types";
import { logout, setReduxUser } from "@/store/userSlice";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import Toast from "react-native-toast-message";
import { useDispatch } from "react-redux";


const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const dispatch = useDispatch();
  const router = useRouter();
  const { t } = useTranslation();


  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // Retrieve stored user from AsyncStorage
        const storedUser = await AsyncStorage.getItem("user");
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setIsAuthenticated(true);
          dispatch(setReduxUser(parsedUser));
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        // console.error("Error checking auth status:", error);
      } finally {
        // Simulate loading delay before showing UI
        setTimeout(() => {
          setIsLoading(false);
        }, 1500);
      }
    };

    checkAuthStatus();
  }, []);

  const signIn = async (mobile: string, password: string): Promise<any> => {
    try {
      Toast.show({
        type: "info",
        text1: t("auth.signing_in"),
        text2: t("auth.please_wait_login"),
      });

      const response = await fetch(api.login, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile, password }),
      });

      const data = await response.json();


      if (data.success) {
        Toast.show({
          type: "success",
          text1: t("auth.login_successful"),
          text2: t("auth.welcome_user", { name: data.user.name }),
          visibilityTime: 1500,
        });

        await AsyncStorage.setItem("user", JSON.stringify(data.user));
        await AsyncStorage.setItem("token", JSON.stringify(data.token));
        dispatch(setReduxUser(data.user));
        setUser(data.user);
        setIsAuthenticated(true);
        return data;
      } else {
        Toast.show({
          type: "error",
          text1: t("auth.login_failed"),
          text2: data.message,
        });

        setIsAuthenticated(false);
        return data;
      }
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: t("common.network_error"),       // "Network Error"
        text2: t("common.something_wrong_retry")
      });

      return { success: false, message: "Something Went Wrong." };
    }
  };

  const signUp = async (
    name: string,
    mobile: string,
    role?: string

  ): Promise<any> => {
    const requestBody: any = {
      name,
      mobile: mobile,
      ...(role && { role })
    };

    try {
      Toast.show({
        type: "info",
        text1: t("auth.signing_up"),
        text2: t("common.please_wait"),
      });

      const response = await fetch(api.signup, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });
      const data = await response.json();

      if (data.success) {
        Toast.show({
          type: "success",
          text1: t("auth.signup_successful"),       // "Sign up Successful!"
          text2: t("auth.welcome_user", { name: data.user.name }),
        });

        // Store user data in AsyncStorage (React Native does not support localStorage)
        await AsyncStorage.setItem("user", JSON.stringify(data.user));
        await AsyncStorage.setItem("token", JSON.stringify(data.token));
        dispatch(setReduxUser(data.user));
        setUser(data.user);
        setIsAuthenticated(true);
        return data;
      } else {
        // Error toast for failed login
        Toast.show({
          type: "error",
          text1: t("auth.signup_failed"), // "Signup Failed"
          text2: data.message,
        });
        setIsAuthenticated(false);
        return data;
      }
    } catch (error) {
      console.error('Sign up error:', error);
      // throw error;
      Toast.show({
        type: "error",
        text1: t("common.network_error"),
        text2: t("common.something_wrong_retry"),
      });
      return { success: false, message: "Something Went Wrong." };
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (!email) {
        throw new Error("Email is required");
      }

      // Store the email for the reset flow
      localStorage.setItem("resetEmail", email);

      return;
    } catch (error) {
      // console.error('Forgot password error:', error);
      throw error;
    }
  };

  const resetPassword = async (
    email: string,
    code: string,
    newPassword: string
  ) => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (!email || !code || !newPassword) {
        throw new Error("All fields are required");
      }

      // In a real app, this would validate the code and update the password
      // For demo purposes, we'll accept any 6-digit code
      if (code.length !== 6 || !/^\d+$/.test(code)) {
        throw new Error("Invalid verification code");
      }

      // Clear the reset email
      localStorage.removeItem("resetEmail");

      return;
    } catch (error) {
      // console.error('Reset password error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("user");

    Toast.show({
      type: "success",
      text1: t("auth.logout_successful"), // "Logged out successfully!"
      text2: t("auth.come_back_soon"),
    });
    dispatch(logout());
    setUser(null);
    setIsAuthenticated(false);
    router.replace("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        user,
        signIn,
        signUp,
        signOut,
        forgotPassword,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
