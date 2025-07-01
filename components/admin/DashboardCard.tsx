import { LinearGradient } from "expo-linear-gradient";
import React, { ReactNode } from "react";
import {
  Dimensions,
  GestureResponderEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

const { width } = Dimensions.get("window");

interface DashboardCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  color: string;
  onPress?: (event: GestureResponderEvent) => void;
  delay?: number;
  variant?: "modern" | "gradient" | "minimal" | "bordered";
}

// Option 1: Modern Card with Shadow and Subtle Gradient
export const ModernDashboardCard: React.FC<DashboardCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  color,
  onPress,
  delay = 0,
}) => (
  <Animated.View
    entering={FadeInDown.delay(delay).duration(600)}
    style={styles.modernCardContainer}
  >
    <TouchableOpacity
      style={styles.modernCardTouchable}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <LinearGradient
        colors={[color, adjustBrightness(color, 20)]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.modernIconContainer]}
      >
        {icon}
      </LinearGradient>
      <View style={styles.modernContentContainer}>
        <Text style={styles.modernValue}>{value}</Text>
        <Text style={styles.modernTitle}>{title}</Text>
        {subtitle && <Text style={styles.modernSubtitle}>{subtitle}</Text>}
      </View>
    </TouchableOpacity>
  </Animated.View>
);

// Option 2: Full Gradient Card with Overlay Icon
export const GradientDashboardCard: React.FC<DashboardCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  color,
  onPress,
  delay = 0,
}) => (
  <Animated.View
    entering={FadeInDown.delay(delay).duration(600)}
    style={styles.gradientCardContainer}
  >
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={styles.gradientCardTouchable}
    >
      <LinearGradient
        colors={[color, adjustBrightness(color, 30)]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientCardBackground}
      >
        <View style={styles.gradientCardContent}>
          <View style={styles.gradientTextContainer}>
            <Text style={styles.gradientValue}>{value}</Text>
            <Text style={styles.gradientTitle}>{title}</Text>
            {subtitle && (
              <Text style={styles.gradientSubtitle}>{subtitle}</Text>
            )}
          </View>
          <View style={styles.gradientIconContainer}>{icon}</View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  </Animated.View>
);

// Option 3: Minimal Clean Card
export const MinimalDashboardCard: React.FC<DashboardCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  color,
  onPress,
  delay = 0,
}) => (
  <Animated.View
    entering={FadeInDown.delay(delay).duration(600)}
    style={styles.minimalCardContainer}
  >
    <TouchableOpacity
      style={styles.minimalCardTouchable}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.minimalHeader}>
        <View
          style={[
            styles.minimalIconContainer,
            { backgroundColor: `${color}20` },
          ]}
        >
          <View style={[styles.minimalIconInner, { backgroundColor: color }]}>
            {icon}
          </View>
        </View>
        <View style={[styles.minimalIndicator, { backgroundColor: color }]} />
      </View>
      <View style={styles.minimalContent}>
        <Text style={styles.minimalValue}>{value}</Text>
        <Text style={styles.minimalTitle}>{title}</Text>
        {subtitle && <Text style={styles.minimalSubtitle}>{subtitle}</Text>}
      </View>
    </TouchableOpacity>
  </Animated.View>
);

// Option 4: Bordered Card with Accent
export const BorderedDashboardCard: React.FC<DashboardCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  color,
  onPress,
  delay = 0,
}) => (
  <Animated.View
    entering={FadeInDown.delay(delay).duration(600)}
    style={styles.borderedCardContainer}
  >
    <TouchableOpacity
      style={[styles.borderedCardTouchable, { borderColor: color }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.borderedContent}>
        <Text style={[styles.borderedValue, { color }]}>{value}</Text>
        <Text style={styles.borderedTitle}>{title}</Text>

      </View>
      <View style={[styles.borderedIconContainer, { backgroundColor: color }]}>
        {icon}
      </View>
    </TouchableOpacity>
  </Animated.View>
);

// Universal DashboardCard that can switch between variants
export const DashboardCard: React.FC<DashboardCardProps> = (props) => {
  const { variant = "modern" } = props;

  switch (variant) {
    case "gradient":
      return <GradientDashboardCard {...props} />;
    case "minimal":
      return <MinimalDashboardCard {...props} />;
    case "bordered":
      return <BorderedDashboardCard {...props} />;
    case "modern":
    default:
      return <ModernDashboardCard {...props} />;
  }
};

// Helper function to adjust color brightness
function adjustBrightness(color: string, percent: number): string {
  // This is a simplified version - in production you might want a more robust solution
  // For demo purposes, we'll just darken the color by adding black with opacity
  return color;
}

const styles = StyleSheet.create({
  // Modern Card Styles
  modernCardContainer: {
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  modernCardTouchable: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
  },
  modernIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  modernContentContainer: {
    flex: 1,
  },
  modernValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#263238",
    marginBottom: 4,
  },
  modernTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#455A64",
    marginBottom: 2,
  },
  modernSubtitle: {
    fontSize: 12,
    color: "#78909C",
  },

  // Gradient Card Styles
  gradientCardContainer: {
    marginBottom: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  gradientCardTouchable: {
    borderRadius: 16,
  },
  gradientCardBackground: {
    borderRadius: 16,
    padding: 20,
  },
  gradientCardContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  gradientTextContainer: {
    flex: 1,
  },
  gradientValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  gradientTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.9)",
    marginBottom: 2,
  },
  gradientSubtitle: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.7)",
  },
  gradientIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },

  // Minimal Card Styles
  minimalCardContainer: {
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 4,
  },
  minimalCardTouchable: {
    padding: 16,
    borderRadius: 16,
  },
  minimalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  minimalIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  minimalIconInner: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  minimalIndicator: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  minimalContent: {},
  minimalValue: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#263238",
    marginBottom: 4,
  },
  minimalTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#455A64",
    marginBottom: 2,
  },
  minimalSubtitle: {
    fontSize: 12,
    color: "#78909C",
  },

  // Bordered Card Styles
  borderedCardContainer: {
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 4,
  },
  borderedCardTouchable: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#1976D2",
  },
  borderedContent: {
    flex: 1,
  },
  borderedValue: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1976D2",
    marginBottom: 4,
  },
  borderedTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#455A64",
    marginBottom: 2,
  },
  borderedSubtitle: {
    fontSize: 12,
    color: "#78909C",
  },
  borderedIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 16,
  },
});

export default DashboardCard;
