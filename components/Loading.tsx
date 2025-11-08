// Enhanced Dairy Management Loading Screen Component
// This is a React Native Expo component with advanced animations and dairy theming

import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");

interface DairyLoadingScreenProps {
  loading: boolean;
  loadingText?: string;
}

const DairyLoadingScreen: React.FC<DairyLoadingScreenProps> = ({
  loading,
  loadingText = "Preparing your dairy dashboard...",
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const milkDropAnim = useRef(new Animated.Value(-50)).current;
  const cowBounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (loading) {
      // Start all animations
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();

      // Continuous rotation animation
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();

      // Progress bar animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(progressAnim, {
            toValue: 1,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
          Animated.timing(progressAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: false,
          }),
        ])
      ).start();

      // Milk drop animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(milkDropAnim, {
            toValue: height * 0.3,
            duration: 1500,
            easing: Easing.bounce,
            useNativeDriver: true,
          }),
          Animated.timing(milkDropAnim, {
            toValue: -50,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Cow bounce animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(cowBounceAnim, {
            toValue: -10,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(cowBounceAnim, {
            toValue: 0,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [loading]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  if (!loading) return null;

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={["#4ade80", "#22c55e", "#16a34a"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Background Pattern */}
        <View style={styles.backgroundPattern}>
          {[...Array(6)].map((_, i) => (
            <Animated.View
              key={i}
              style={[
                styles.backgroundCircle,
                {
                  opacity: 0.1,
                  transform: [
                    {
                      scale: scaleAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.5, 1 + i * 0.1],
                      }),
                    },
                  ],
                },
              ]}
            />
          ))}
        </View>

        {/* Main Content */}
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Dairy Farm Icon with Cow */}
          <View style={styles.iconContainer}>
            <Animated.View
              style={[
                styles.cowContainer,
                {
                  transform: [{ translateY: cowBounceAnim }],
                },
              ]}
            >
              <MaterialIcons name="agriculture" size={80} color="#ffffff" />
            </Animated.View>

            {/* Rotating Gear */}
            <Animated.View
              style={[
                styles.gearContainer,
                {
                  transform: [{ rotate: spin }],
                },
              ]}
            >
              <MaterialIcons name="settings" size={30} color="#ffffff" />
            </Animated.View>
          </View>

          {/* Milk Drops Animation */}
          <View style={styles.milkDropsContainer}>
            {[...Array(3)].map((_, i) => (
              <Animated.View
                key={i}
                style={[
                  styles.milkDrop,
                  {
                    left: width * 0.4 + i * 20,
                    transform: [
                      {
                        translateY: milkDropAnim.interpolate({
                          inputRange: [-50, height * 0.3],
                          outputRange: [-50 - i * 200, height * 0.3 - i * 200],
                        }),
                      },
                    ],
                  },
                ]}
              />
            ))}
          </View>

          {/* App Title */}
          <Animated.Text
            style={[
              styles.title,
              {
                opacity: fadeAnim,
              },
            ]}
          >
            Sita Dairy
          </Animated.Text>

          {/* Loading Text */}
          <Animated.Text
            style={[
              styles.loadingText,
              {
                opacity: fadeAnim,
              },
            ]}
          >
            {loadingText}
          </Animated.Text>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    width: progressWidth,
                  },
                ]}
              />
            </View>
          </View>

          {/* Feature Icons */}
          <View style={styles.featuresContainer}>
            {[
              { icon: "pets", label: "Cattle" },
              { icon: "local-drink", label: "Milk" },
              { icon: "assessment", label: "Reports" },
              { icon: "schedule", label: "Schedule" },
            ].map((feature, index) => (
              <Animated.View
                key={feature.label}
                style={[
                  styles.featureItem,
                  {
                    opacity: fadeAnim,
                    transform: [
                      {
                        translateY: fadeAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [50, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <MaterialIcons
                  name={feature.icon as any}
                  size={24}
                  color="#ffffff"
                  style={{ opacity: 0.8 }}
                />
                <Text style={styles.featureLabel}>{feature.label}</Text>
              </Animated.View>
            ))}
          </View>
        </Animated.View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  gradient: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  backgroundPattern: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  backgroundCircle: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "#ffffff",
  },
  content: {
    alignItems: "center",
    paddingHorizontal: 40,
  },
  iconContainer: {
    position: "relative",
    marginBottom: 30,
  },
  cowContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  gearContainer: {
    position: "absolute",
    top: -10,
    right: -15,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 20,
    padding: 5,
  },
  milkDropsContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  milkDrop: {
    position: "absolute",
    width: 8,
    height: 12,
    backgroundColor: "#ffffff",
    borderRadius: 4,
    opacity: 0.7,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 10,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  loadingText: {
    fontSize: 16,
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 30,
    opacity: 0.9,
  },
  progressContainer: {
    width: width * 0.7,
    marginBottom: 40,
  },
  progressBar: {
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#ffffff",
    borderRadius: 2,
  },
  featuresContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: width * 0.8,
    marginTop: 20,
  },
  featureItem: {
    alignItems: "center",
    opacity: 0.8,
  },
  featureLabel: {
    color: "#ffffff",
    fontSize: 12,
    marginTop: 5,
    fontWeight: "500",
  },
});

export default DairyLoadingScreen;
