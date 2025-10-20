import AuthTemplate from "@/components/auth/AuthTemplate";
import { Feather, FontAwesome } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { useAuth } from "../../context/AuthContext";

export default function Signup() {
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { signUp } = useAuth();
  const router = useRouter();
  const mobileRef = useRef<TextInput>(null);
  const { t } = useTranslation();

  const handleSignup = async () => {
    // Reset error state
    setError(null);

    // Trim inputs
    const trimmedName = name.trim();
    let trimmedMobile = mobile.replace(/\D/g, ""); // remove all non-digits

    // Handle country code (+91 or 91XXXXXXXXXX)
    if (trimmedMobile.startsWith("91") && trimmedMobile.length === 12) {
      trimmedMobile = trimmedMobile.slice(2);
    }

    // Format mobile number (remove +91 prefix and spaces)
    if (trimmedMobile.startsWith("+91")) {
      trimmedMobile = trimmedMobile.replace("+91", "");
    }
    trimmedMobile = trimmedMobile.replace(/\s+/g, "");

    // Validation regex
    const nameRegex = /^[a-zA-Z\s]+$/;
    const mobileRegex = /^[6-9]\d{9}$/; // strict Indian mobile number


    // Field presence check
    if (
      !trimmedName ||
      !trimmedMobile
    ) {
      setError(t("validation.all_fields_required"));
      return;
    }

    // Field validations
    if (!nameRegex.test(trimmedName)) {
      setError(t("validation.name"));
      return;
    }

    if (!mobileRegex.test(trimmedMobile)) {
      if (trimmedMobile.length !== 10) {
        setError(t("validation.mobile"));
      } else if (!/^[6-9]/.test(trimmedMobile)) {
        setError(t("validation.mobile_range"));
      } else {
        setError(t("validation.mobile_indian"));
      }
      return;
    }

    setIsLoading(true);
    try {

      // Uncomment when you have the actual implementation
      const response = await signUp(
        trimmedName,
        trimmedMobile,

      );

      if (response.success) {
        if (response.user.role === "Admin") {
          router.replace("/(admin)");
        } else {
          router.replace("/(tabs)");
        }
      } else {
        setError(response.message || t("err.create_account"));
      }
    } catch (err: any) {
      // Optionally log the error for debugging
      // console.error("Signup error:", err);
      setError(
        err?.message
          ? `${t("err.create_account")}: ${err.message}`
          : t("err.create_account")
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthTemplate>
      <View style={styles.formContainer}>
        <Text style={styles.title}>{t("auth.create_account")}</Text>
        <Text style={styles.subtitle}>{t("auth.join_our_dairy_community")}</Text>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <View style={styles.inputContainer}>
          <Feather
            name="user"
            size={20}
            color="#38bdf8"
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            placeholder={t("common.full_name")}
            placeholderTextColor="#93c5fd"
            value={name}
            onChangeText={setName}
            editable={!isLoading}
            returnKeyType="next"
            onSubmitEditing={() => mobileRef.current?.focus()}
          />
        </View>
        <View style={styles.inputContainer}>
          <FontAwesome
            name="phone"
            size={20}
            color="#38bdf8"
            style={styles.inputIcon}
          />
          <TextInput
            ref={mobileRef}
            style={styles.input}
            placeholder={t("common.mobile_number")}
            placeholderTextColor="#93c5fd"
            value={mobile}
            onChangeText={setMobile}
            autoCapitalize="none"
            keyboardType="number-pad"
            editable={!isLoading}
            onSubmitEditing={() => handleSignup()}
          />
        </View>

        <TouchableOpacity
          disabled={isLoading}
          style={styles.signupButton}
          onPress={handleSignup}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.signupButtonText}>{t("auth.join_sita_dairy")}</Text>
          )}
        </TouchableOpacity>

        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>{t("auth.already_have_account")}? </Text>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity>
              <Text style={styles.loginLink}>{t("auth.sign_in")}</Text>
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
