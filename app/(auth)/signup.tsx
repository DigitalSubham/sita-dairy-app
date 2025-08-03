import { Feather, FontAwesome } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Link, useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
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

  const handleSignup = async () => {
    // Reset error state
    setError(null);

    // Trim inputs
    const trimmedName = name.trim();
    let trimmedMobile = mobile.trim();

    // Format mobile number (remove +91 prefix and spaces)
    if (trimmedMobile.startsWith("+91")) {
      trimmedMobile = trimmedMobile.replace("+91", "");
    }
    trimmedMobile = trimmedMobile.replace(/\s+/g, "");

    // Validation regex
    const nameRegex = /^[a-zA-Z\s]+$/;
    const mobileRegex = /^\d{10}$/;

    // Field presence check
    if (
      !trimmedName ||
      !trimmedMobile
    ) {
      setError("Please fill in all fields");
      return;
    }

    // Field validations
    if (!nameRegex.test(trimmedName)) {
      setError("Name should contain only letters and spaces");
      return;
    }


    if (!mobileRegex.test(trimmedMobile)) {
      setError("Please enter a valid 10-digit mobile number");
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
        setError(response.message || "Failed to create account");
      }
    } catch (err: any) {
      // Optionally log the error for debugging
      // console.error("Signup error:", err);
      setError(
        err?.message
          ? `Failed to create account: ${err.message}`
          : "Failed to create account"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient colors={["#e6f0ff", "#f0f9ff"]} style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Image
              source={require('../../assets/images/adaptive-icon.png')}
              style={{ width: 200, height: 200 }}
            />
          </View>
          <Text style={styles.logoText}>Sita Dairy</Text>
          <Text style={styles.logoSubtext}>Management System</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join our dairy community</Text>

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
              placeholder="Full Name"
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
              placeholder="Mobile Number"
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
              <Text style={styles.signupButtonText}>Join Sita Dairy</Text>
            )}
          </TouchableOpacity>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text style={styles.loginLink}>Sign In</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>

        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>
            © 2025 Sita Dairy Management System
          </Text>
        </View>
      </ScrollView>

      {/* Milk bottle decorations */}
      <View style={styles.milkBottleLeft}>
        <View style={styles.bottleNeck} />
        <View style={styles.bottleBody} />
      </View>

      <View style={styles.milkBottleRight}>
        <View style={styles.bottleNeck} />
        <View style={styles.bottleBody} />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#e6f0ff",
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  logoContainer: {
    alignItems: "center",
    marginTop: 60,
    marginBottom: 30,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
    borderWidth: 4,
    borderColor: "white",
  },
  logoText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#0c4a6e",
    marginTop: 12,
  },
  logoSubtext: {
    fontSize: 16,
    color: "#0284c7",
    fontWeight: "500",
  },
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
  footerContainer: {
    marginTop: 30,
    alignItems: "center",
  },
  footerText: {
    color: "#0284c7",
    fontSize: 12,
  },
  milkBottleLeft: {
    position: "absolute",
    bottom: 0,
    left: 20,
    opacity: 0.2,
    alignItems: "center",
  },
  milkBottleRight: {
    position: "absolute",
    bottom: 0,
    right: 20,
    opacity: 0.2,
    alignItems: "center",
  },
  bottleNeck: {
    width: 15,
    height: 20,
    backgroundColor: "white",
    borderTopLeftRadius: 7.5,
    borderTopRightRadius: 7.5,
    borderWidth: 1,
    borderColor: "#bae6fd",
  },
  bottleBody: {
    width: 40,
    height: 60,
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: "#bae6fd",
  },
});
