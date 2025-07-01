import { api } from "@/constants/api";
import type { RootState } from "@/store/store";
import { setReduxUser } from "@/store/userSlice";
import { Entypo, FontAwesome } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect } from "expo-router";
import type React from "react";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import Toast from "react-native-toast-message";
import { useDispatch, useSelector } from "react-redux";

interface ProfileProps {
  isEditing: boolean;
  setIsEditing: (isEditing: boolean) => void;
}

const ProfileComponent: React.FC<ProfileProps> = ({ isEditing, setIsEditing }) => {
  const [isLoading, setIsLoading] = useState(false);
  const user = useSelector((store: RootState) => store.user);
  const [editedUser, setEditedUser] = useState({
    id: user.id || "82102",
    name: user.name || "Good Boy",
    mobile: user.mobile || "8210243998",
    collectionCenter: user.collectionCenter || "Bad Boy",
    dailryName: user.dailryName || "dailryName",
    fatherName: user.fatherName || "fatherName",
    role: user.role || "Admin",
    isVerified: user.isVerified || false,
    createdAt: user.createdAt || "2025-05-20T17:07:32.815Z",
    profilePic:
      user.profilePic ||
      "https://res.cloudinary.com/dskra60sa/image/upload/v1743086699/man_rqv4zk.png",
    address: user.address || "",
  });
  const [imageFile, setImageFile] = useState<any>(null);
  const dispatch = useDispatch();
  const [validationErrors, setValidationErrors] = useState({
    name: "",
    mobile: "",
    fatherName: "",
    address: "",
  });

  useFocusEffect(
    useCallback(() => {
      // Reset editing state when screen comes into focus
      setIsEditing(false);
      setEditedUser({
        id: user.id || "82102",
        name: user.name || "Good Boy",
        mobile: user.mobile || "8210243998",
        collectionCenter: user.collectionCenter || "Bad Boy",
        dailryName: user.dailryName || "dailryName",
        fatherName: user.fatherName || "fatherName",
        role: user.role || "Admin",
        isVerified: user.isVerified || false,
        createdAt: user.createdAt || "2025-05-20T17:07:32.815Z",
        profilePic:
          user.profilePic ||
          "https://res.cloudinary.com/dskra60sa/image/upload/v1743086699/man_rqv4zk.png",
        address: user.address || "",
      });
    }, [user])
  );

  const handleSave = async () => {
    setIsLoading(true);

    // Reset validation errors
    setValidationErrors({
      name: "",
      mobile: "",
      fatherName: "",
      address: "",
    });

    // Basic Validation
    const nameRegex = /^[a-zA-Z\s]{2,}$/;
    const phoneRegex = /^\d{10}$/;
    const textRegex = /^.{2,}$/;

    let hasErrors = false;

    if (!nameRegex.test(editedUser.name)) {
      setValidationErrors((prev) => ({
        ...prev,
        name: "Please enter a valid name (at least 2 characters)",
      }));
      hasErrors = true;
    }

    if (!phoneRegex.test(editedUser.mobile)) {
      setValidationErrors((prev) => ({
        ...prev,
        mobile: "Please enter a valid 10-digit mobile number",
      }));
      hasErrors = true;
    }

    if (!textRegex.test(editedUser.fatherName)) {
      setValidationErrors((prev) => ({
        ...prev,
        fatherName: "Please enter a valid father's name",
      }));
      hasErrors = true;
    }

    if (editedUser.address && !textRegex.test(editedUser.address)) {
      setValidationErrors((prev) => ({
        ...prev,
        address: "Please enter a valid address",
      }));
      hasErrors = true;
    }

    if (hasErrors) {
      setIsLoading(false);
      return;
    }

    try {
      const storedToken = await AsyncStorage.getItem("token");
      if (!storedToken) {
        Toast.show({
          type: "error",
          text1: "Authentication token not found",
        });
        return;
      }

      const parsedToken = JSON.parse(storedToken);

      const formData = new FormData();
      formData.append("name", editedUser.name);
      formData.append("mobile", editedUser.mobile);
      formData.append("fatherName", editedUser.fatherName);
      formData.append("address", editedUser.address);

      if (editedUser.profilePic) {
        const fileUri = editedUser.profilePic;
        const filename = fileUri.split("/").pop() || "profile.jpg";
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : "image";

        formData.append("profilePic", {
          uri: fileUri,
          name: filename,
          type,
        } as any);
      }

      const response = await fetch(api.updateUser, {
        method: "PUT",
        headers: {
          // "Content-Type": "application/json",
          Authorization: `Bearer ${parsedToken}`,
        },
        body: formData,
      });

      const responseData = await response.json();

      if (response.ok) {
        Toast.show({
          type: "success",
          text1: responseData.message || "Profile updated successfully",
        });
        setIsEditing(false);
        setImageFile(null);
        if (responseData.user) {
          setEditedUser((prev) => ({
            ...prev,
            ...responseData.user,
            profilePic: responseData.user.profilePic,
          }));
          dispatch(setReduxUser(responseData.user));
        }
      } else {
        Toast.show({
          type: "error",
          text1: responseData.message || "Failed to update profile",
        });
      }
    } catch (err) {
      Toast.show({
        type: "error",
        text1: "Something went wrong. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset to original values
    setEditedUser({
      id: user.id || "82102",
      name: user.name || "Good Boy",
      mobile: user.mobile || "8210243998",
      collectionCenter: user.collectionCenter || "Bad Boy",
      dailryName: user.dailryName || "dailryName",
      fatherName: user.fatherName || "fatherName",
      role: user.role || "Admin",
      isVerified: user.isVerified || false,
      createdAt: user.createdAt || "2025-05-20T17:07:32.815Z",
      profilePic:
        user.profilePic ||
        "https://res.cloudinary.com/dskra60sa/image/upload/v1743086699/man_rqv4zk.png",
      address: user.address || "",
    });
    setImageFile(null);
    setValidationErrors({
      name: "",
      mobile: "",
      fatherName: "",
      address: "",
    });
    setIsEditing(false);
  };

  const pickImage = async (): Promise<void> => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "We need camera roll permissions to change your profile picture"
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedAsset = result.assets[0];
        setImageFile(selectedAsset);
        setEditedUser({
          ...editedUser,
          profilePic: selectedAsset.uri,
        });
      }
    } catch (error) {
      Alert.alert("Error", "Failed to select image");
    }
  };

  function formatDate(createdAt: any) {
    const date = new Date(createdAt);
    const day = String(date.getDate()).padStart(2, "0");
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Animated.View
            entering={FadeInDown.duration(600)}
            style={styles.profileImageContainer}
          >
            <Image
              source={{ uri: editedUser.profilePic }}
              style={styles.profilePic}
            />
            {isEditing && (
              <TouchableOpacity
                style={styles.editImageButton}
                onPress={pickImage}
              >
                <FontAwesome name="camera" size={16} color="#fff" />
              </TouchableOpacity>
            )}
          </Animated.View>

          {/* User ID - Prominent Display */}
          <Animated.View
            entering={FadeInUp.duration(300)}
            style={styles.userIdContainer}
          >
            <Text style={styles.userIdLabel}>User ID</Text>
            <View style={styles.userIdBadge}>
              <FontAwesome name="id-card" size={16} color="#dc2626" />
              <Text style={styles.userIdText}>#{editedUser.id}</Text>
            </View>
          </Animated.View>

          {isEditing ? (
            <Animated.View
              entering={FadeInUp.duration(300)}
              style={styles.editNameContainer}
            >
              <TextInput
                style={[
                  styles.editNameInput,
                  validationErrors.name ? styles.inputError : null,
                ]}
                value={editedUser.name}
                onChangeText={(text) =>
                  setEditedUser({ ...editedUser, name: text })
                }
                placeholder="Your Name"
                placeholderTextColor="#6b7280"
              />
              {validationErrors.name ? (
                <Text style={styles.errorText}>{validationErrors.name}</Text>
              ) : null}
            </Animated.View>
          ) : (
            <Animated.Text
              entering={FadeInUp.duration(300)}
              style={styles.name}
            >
              {editedUser.name}
            </Animated.Text>
          )}

          <View style={styles.roleContainer}>
            <View style={styles.roleBadge}>
              <FontAwesome name="user" size={14} color="#4f46e5" />
              <Text style={styles.roleText}>{editedUser.role}</Text>
            </View>
            {editedUser.isVerified && (
              <View style={styles.verifiedBadge}>
                <FontAwesome name="check-circle" size={14} color="#10b981" />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            )}
          </View>
        </View>

        <Animated.View entering={FadeInUp.delay(300)} style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>

          {/* User ID - Also in section for emphasis */}
          <View style={styles.infoItem}>
            <FontAwesome
              name="id-card"
              size={20}
              color="#dc2626"
              style={styles.infoIcon}
            />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>User ID (Non-editable)</Text>
              <View style={styles.idDisplayContainer}>
                <Text style={styles.idDisplayText}>#{editedUser.id}</Text>
                <View style={styles.lockIcon}>
                  <FontAwesome name="lock" size={12} color="#6b7280" />
                </View>
              </View>
            </View>
          </View>

          <View style={styles.infoItem}>
            <FontAwesome
              name="mobile"
              size={20}
              color="#4f46e5"
              style={styles.infoIcon}
            />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Mobile Number</Text>
              {isEditing ? (
                <TextInput
                  style={[
                    styles.editInfoInput,
                    validationErrors.mobile ? styles.inputError : null,
                  ]}
                  value={String(editedUser.mobile)}
                  onChangeText={(text) =>
                    setEditedUser({ ...editedUser, mobile: text })
                  }
                  placeholder="Your Phone"
                  placeholderTextColor="#6b7280"
                  keyboardType="phone-pad"
                />
              ) : (
                <Text style={styles.infoValue}>{editedUser.mobile}</Text>
              )}
              {validationErrors.mobile ? (
                <Text style={styles.errorText}>{validationErrors.mobile}</Text>
              ) : null}
            </View>
          </View>

          <View style={styles.infoItem}>
            <FontAwesome
              name="user"
              size={20}
              color="#059669"
              style={styles.infoIcon}
            />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Father's Name</Text>
              {isEditing ? (
                <TextInput
                  style={[
                    styles.editInfoInput,
                    validationErrors.fatherName ? styles.inputError : null,
                  ]}
                  value={editedUser.fatherName}
                  onChangeText={(text) =>
                    setEditedUser({ ...editedUser, fatherName: text })
                  }
                  placeholder="Father's Name"
                  placeholderTextColor="#6b7280"
                />
              ) : (
                <Text style={styles.infoValue}>{editedUser.fatherName}</Text>
              )}
              {validationErrors.fatherName ? (
                <Text style={styles.errorText}>
                  {validationErrors.fatherName}
                </Text>
              ) : null}
            </View>
          </View>

          {/* Address Field */}
          <View style={styles.infoItem}>
            <FontAwesome
              name="map-marker"
              size={20}
              color="#f59e0b"
              style={styles.infoIcon}
            />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Address</Text>
              {isEditing ? (
                <TextInput
                  style={[
                    styles.editInfoInput,
                    styles.addressInput,
                    validationErrors.address ? styles.inputError : null,
                  ]}
                  value={editedUser.address}
                  onChangeText={(text) =>
                    setEditedUser({ ...editedUser, address: text })
                  }
                  placeholder="Enter your address"
                  placeholderTextColor="#6b7280"
                  multiline={true}
                  numberOfLines={3}
                />
              ) : (
                <Text style={styles.infoValue}>
                  {editedUser.address || "Data is coming..."}
                </Text>
              )}
              {validationErrors.address ? (
                <Text style={styles.errorText}>{validationErrors.address}</Text>
              ) : null}
            </View>
          </View>

          <View style={styles.infoItem}>
            <FontAwesome
              name="calendar"
              size={20}
              color="#dc2626"
              style={styles.infoIcon}
            />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Member Since (Non-editable)</Text>
              <View style={styles.nonEditableContainer}>
                <Text style={styles.infoValue}>
                  {formatDate(editedUser.createdAt)}
                </Text>
                <View style={styles.lockIcon}>
                  <FontAwesome name="lock" size={12} color="#6b7280" />
                </View>
              </View>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(400)} style={styles.section}>
          <Text style={styles.sectionTitle}>
            Business Information (Non-editable)
          </Text>

          <View style={styles.infoItem}>
            <FontAwesome
              name="building"
              size={20}
              color="#7c3aed"
              style={styles.infoIcon}
            />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Dairy Name (Non-editable)</Text>
              <View style={styles.nonEditableContainer}>
                <Text style={styles.infoValue}>{editedUser.dailryName}</Text>
                <View style={styles.lockIcon}>
                  <FontAwesome name="lock" size={12} color="#6b7280" />
                </View>
              </View>
            </View>
          </View>

          <View style={styles.infoItem}>
            <FontAwesome
              name="map-marker"
              size={20}
              color="#ea580c"
              style={styles.infoIcon}
            />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>
                Collection Center (Non-editable)
              </Text>
              <View style={styles.nonEditableContainer}>
                <Text style={styles.infoValue}>
                  {editedUser.collectionCenter}
                </Text>
                <View style={styles.lockIcon}>
                  <FontAwesome name="lock" size={12} color="#6b7280" />
                </View>
              </View>
            </View>
          </View>
        </Animated.View>

        <Animated.View
          entering={FadeInUp.delay(500)}
          style={styles.buttonContainer}
        >
          {isEditing ? (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.saveButton]}
                onPress={handleSave}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <FontAwesome
                      name="save"
                      size={18}
                      color="#fff"
                      style={styles.buttonIcon}
                    />
                    <Text style={styles.buttonText}>Save Changes</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={handleCancel}
                disabled={isLoading}
              >
                <Entypo
                  name="cross"
                  size={18}
                  color="#fff"
                  style={styles.buttonIcon}
                />
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={styles.editProfileButton}
              onPress={() => setIsEditing(true)}
            >
              <FontAwesome
                name="edit"
                size={18}
                color="#fff"
                style={styles.buttonIcon}
              />
              <Text style={styles.editProfileButtonText}>Edit Profile</Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    alignItems: "center",
    paddingVertical: 30,
    paddingHorizontal: 20,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  profileImageContainer: {
    position: "relative",
    marginBottom: 20,
  },
  profilePic: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: "#e5e7eb",
  },
  editImageButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#4f46e5",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#ffffff",
  },
  // User ID Styles - Prominent Display
  userIdContainer: {
    alignItems: "center",
    marginBottom: 15,
  },
  userIdLabel: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "500",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  userIdBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef2f2",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: "#fecaca",
    gap: 8,
  },
  userIdText: {
    fontSize: 18,
    color: "#dc2626",
    fontWeight: "bold",
    fontFamily: "monospace",
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 8,
  },
  editNameContainer: {
    marginBottom: 8,
    width: "80%",
  },
  editNameInput: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#111827",
    textAlign: "center",
    borderBottomWidth: 2,
    borderBottomColor: "#4f46e5",
    paddingVertical: 4,
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  roleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eef2ff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  roleText: {
    fontSize: 14,
    color: "#4f46e5",
    fontWeight: "600",
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ecfdf5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  verifiedText: {
    fontSize: 14,
    color: "#10b981",
    fontWeight: "600",
  },
  section: {
    backgroundColor: "#ffffff",
    padding: 20,
    marginTop: 15,
    borderRadius: 16,
    marginHorizontal: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#f3f4f6",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 20,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  infoIcon: {
    marginRight: 15,
    marginTop: 2,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 4,
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 16,
    color: "#111827",
    fontWeight: "500",
  },
  // ID Display Styles
  idDisplayContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef2f2",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#fecaca",
    gap: 8,
  },
  idDisplayText: {
    fontSize: 16,
    color: "#dc2626",
    fontWeight: "bold",
    fontFamily: "monospace",
  },
  // Non-editable container styles
  nonEditableContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    gap: 8,
  },
  lockIcon: {
    marginLeft: "auto",
  },
  editInfoInput: {
    fontSize: 16,
    color: "#111827",
    borderBottomWidth: 2,
    borderBottomColor: "#4f46e5",
    paddingVertical: 4,
    backgroundColor: "#f9fafb",
    borderRadius: 6,
    paddingHorizontal: 8,
  },
  addressInput: {
    minHeight: 60,
    textAlignVertical: "top",
  },
  buttonContainer: {
    paddingHorizontal: 15,
    marginVertical: 25,
  },
  editProfileButton: {
    backgroundColor: "#4f46e5",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  editProfileButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  actionButton: {
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  saveButton: {
    backgroundColor: "#10b981",
  },
  cancelButton: {
    backgroundColor: "#dc2626",
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  errorText: {
    color: "#dc2626",
    fontSize: 12,
    marginTop: 4,
  },
  inputError: {
    borderBottomColor: "#dc2626",
  },
});

export default ProfileComponent;
