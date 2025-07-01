import { useAuth } from "@/context/AuthContext";
import { RootState } from "@/store/store";
import { Ionicons } from "@expo/vector-icons";
import {
  DrawerContentScrollView,
  DrawerItemList,
} from "@react-navigation/drawer";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import {
  Animated,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSelector } from "react-redux";

export function CustomDrawer(props: any) {
  const { signOut } = useAuth();
  const router = useRouter();
  const user = useSelector((store: RootState) => store.user);

  // Multiple animations for staggered effect
  const [profileAnim] = React.useState(new Animated.Value(0));
  const [contentAnim] = React.useState(new Animated.Value(0));
  const [buttonAnim] = React.useState(new Animated.Value(0));

  useEffect(() => {
    // Staggered animations sequence
    Animated.sequence([
      Animated.timing(profileAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(contentAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(buttonAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleSignOut = () => {
    signOut();
    router.replace("/(auth)/login");
  };

  // Transform animations
  const profileTranslateY = profileAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-20, 0],
  });

  const contentTranslateY = contentAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [10, 0],
  });

  const buttonScale = buttonAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1],
  });

  return (
    <View style={styles.container}>
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={styles.drawerScrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.profileContainer,
            {
              opacity: profileAnim,
              transform: [{ translateY: profileTranslateY }],
            },
          ]}
        >
          <LinearGradient
            colors={["#4f46e5", "#7c3aed"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.profileGradient}
          >
            <View style={styles.profileContent}>
              <View style={styles.profileImageWrapper}>
                <Image
                  source={{
                    uri:
                      user.profilePic ??
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        user.name ?? "User"
                      )}&background=random`,
                  }}
                  style={styles.profileImage}
                />
                {user?.role === "Admin" && (
                  <View style={styles.adminBadge}>
                    <Ionicons name="shield-checkmark" size={12} color="#fff" />
                  </View>
                )}
              </View>

              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>
                  {user ? user.name : "Guest User"}
                </Text>
                <Text style={styles.profileEmail}>
                  Id : {user ? user.id : "12345"}
                </Text>

                {(user?.role === "Admin" || user?.role === "Farmer") && (
                  <View style={styles.roleContainer}>
                    <Text style={styles.roleText}>{user?.role}</Text>
                  </View>
                )}
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        <Animated.View
          style={[
            styles.menuContainer,
            {
              opacity: contentAnim,
              transform: [{ translateY: contentTranslateY }],
            },
          ]}
        >
          <View style={styles.menuHeader}>
            <Ionicons name="menu-outline" size={18} color="#94a3b8" />
            <Text style={styles.menuHeaderText}>MENU</Text>
          </View>

          <View style={styles.drawerItemsContainer}>
            <DrawerItemList
              {...props}
              state={{
                ...props.state,
                routes: props.state.routes.map((route: any) => {
                  if (route.name === "payments") {
                    return {
                      ...route,
                      params: { defaultTab: "all" }, // drawer opens "All" tab
                    };
                  }
                  return route;
                }),
              }}
            />
          </View>
        </Animated.View>
      </DrawerContentScrollView>

      <Animated.View
        style={[
          styles.bottomSection,
          { opacity: buttonAnim, transform: [{ scale: buttonScale }] },
        ]}
      >
        <TouchableOpacity
          onPress={handleSignOut}
          style={styles.bottomButton}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={["#f43f5e", "#e11d48"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.signOutButton}
          >
            <Ionicons name="log-out-outline" size={22} color={"#ffffff"} />
            <Text style={styles.bottomButtonText}>Sign Out</Text>
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.versionText}>App Version 1.0.0</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff", // Darker background for better contrast
  },
  drawerScrollContent: {
    paddingTop: 50,
  },
  profileContainer: {
    marginBottom: 20,
    borderRadius: 20,
    marginHorizontal: 12,
    marginTop: 12,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#4f46e5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  profileGradient: {
    borderRadius: 20,
  },
  profileContent: {
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  profileImageWrapper: {
    position: "relative",
    marginRight: 15,
  },
  profileImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.9)",
  },
  adminBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#10b981",
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#0f172a",
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  profileEmail: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 13,
    marginBottom: 8,
  },
  roleContainer: {
    backgroundColor: "rgba(16, 185, 129, 0.2)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#10b981",
  },
  roleText: {
    color: "#10b981",
    fontSize: 12,
    fontWeight: "bold",
  },
  menuContainer: {
    marginHorizontal: 12,
  },
  menuHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  menuHeaderText: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1.2,
    marginLeft: 8,
  },
  drawerItemsContainer: {
    backgroundColor: "rgba(177, 194, 222, 0.5)",
    borderRadius: 16,
    paddingVertical: 8,
    marginBottom: 16,
  },
  bottomSection: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(55, 65, 81, 0.5)",
  },
  bottomButton: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
    elevation: 4,
    shadowColor: "#f43f5e",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 16,
  },
  bottomButtonText: {
    fontSize: 16,
    marginLeft: 10,
    color: "#ffffff",
    fontWeight: "600",
  },
  versionText: {
    color: "#64748b",
    fontSize: 12,
    textAlign: "center",
  },
});
