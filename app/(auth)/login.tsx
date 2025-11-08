import AuthTemplate from "@/components/auth/AuthTemplate";
import { FontAwesome } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Keyboard,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { useAuth } from "../../context/AuthContext";

export default function Login() {
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();
  const router = useRouter();
  const passwordRef = useRef<TextInput>(null);
  const { t } = useTranslation();


  const handleLogin = async () => {
    let trimmedMobile = mobile.replaceAll(/\D/g, ""); // remove all non-digits
    const trimmedPassword = password.trim();

    // Remove +91 and all spaces
    if (trimmedMobile.startsWith("91") && trimmedMobile.length === 12) {
      trimmedMobile = trimmedMobile.slice(2);
    }
    trimmedMobile = trimmedMobile.replaceAll(/\s+/g, "");

    const phoneRegex = /^[6-9]\d{9}$/; // strict Indian mobile number
    if (!trimmedMobile || !trimmedPassword) {
      setError(t("validation.all_fields_required"));
      return;
    }

    if (!phoneRegex.test(trimmedMobile)) {
      setError(t("validation.mobile"));
      return;
    }

    setIsLoading(true);
    try {
      const response = await signIn(trimmedMobile, trimmedPassword);
      if (response.success) {
        if (response.user.role === "Admin") {
          router.replace("/(admin)");
        } else {
          router.replace("/(tabs)");
        }
      } else {
        setError(response.message || t("err.login_fail"));
      }
    } catch (err) {
      console.error(t("err.login_fail"), err);
      setError(t("err.login_fail"));
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
    // If the keyboard is open, don't dismiss it
    if (Platform.OS !== "ios") {
      Keyboard.dismiss();
    }
  };



  return (
    <AuthTemplate>
      <View style={styles.formContainer}>
        <Text style={styles.title}>{t("auth.login_sita_dairy")}</Text>
        <Text style={styles.subtitle} > {t("auth.join_our_dairy_community")}</Text>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <View style={styles.inputContainer}>
          <FontAwesome
            name="phone"
            size={20}
            color="#38bdf8"
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            placeholder={t("common.mobile_number")}
            placeholderTextColor="#93c5fd"
            value={mobile}
            onChangeText={setMobile}
            autoCapitalize="none"
            keyboardType="number-pad"
            editable={!isLoading}
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
          />
        </View>
        <View style={styles.inputContainer}>
          <FontAwesome
            name="key"
            size={20}
            color="#38bdf8"
            style={styles.inputIcon}
          />
          <TextInput
            ref={passwordRef}
            style={styles.input}
            placeholder={t("common.password")}
            placeholderTextColor="#93c5fd"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            keyboardType="number-pad"
            editable={!isLoading}
            onSubmitEditing={() => handleLogin()}
          />
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={togglePasswordVisibility}
          >
            {showPassword ? (
              <FontAwesome name="eye" size={20} color="#666" />
            ) : (
              <FontAwesome name="eye-slash" size={20} color="#666" />
            )}
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          disabled={isLoading}
          style={styles.signupButton}
          onPress={handleLogin}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.signupButtonText}>{t("auth.login_sita_dairy")}</Text>
          )}
        </TouchableOpacity>

        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>{t("auth.create_account")}? </Text>
          <Link href="/(auth)/signup" asChild>
            <TouchableOpacity>
              <Text style={styles.loginLink}>{t("auth.sign_up")}</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </AuthTemplate>
  );
}

const styles = StyleSheet.create({
  formContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    borderRadius: 24,
    padding: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#bae6fd",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#0c4a6e",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#0284c7",
    marginBottom: 24,
  },
  errorText: {
    color: "#ef4444",
    backgroundColor: "#fee2e2",
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#fca5a5",
    overflow: "hidden",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f9ff",
    borderWidth: 1,
    borderColor: "#bae6fd",
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 55,
  },
  inputIcon: {
    marginRight: 12,
  },
  eyeIcon: {
    padding: 5,
  },
  input: {
    flex: 1,
    height: "100%",
    fontSize: 16,
    color: "#0c4a6e",
  },
  signupButton: {
    backgroundColor: "#0ea5e9",
    borderRadius: 12,
    height: 55,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 16,
    shadowColor: "#0ea5e9",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  signupButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 16,
  },
  loginText: {
    color: "#0c4a6e",
    fontSize: 15,
  },
  loginLink: {
    color: "#0ea5e9",
    fontSize: 15,
    fontWeight: "bold",
  },
});
