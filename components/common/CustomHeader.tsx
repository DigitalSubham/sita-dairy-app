import { AntDesign, FontAwesome, Ionicons, MaterialIcons } from "@expo/vector-icons"
import { DrawerActions, useNavigation } from "@react-navigation/native"
import type React from "react"
import { useTranslation } from "react-i18next"
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import Icon from "./Icon"

export interface HeaderAction {
  icon: keyof typeof Ionicons.glyphMap | keyof typeof FontAwesome.glyphMap | keyof typeof AntDesign.glyphMap | keyof typeof MaterialIcons.glyphMap
  iconFamily?: "Ionicons" | "FontAwesome" | "AntDesign" | "MaterialIcons" | "image"
  onPress: () => void
  label?: string
  isSpinner?: boolean
}

export interface CustomHeaderProps {
  title: string
  subtitle?: string
  showBackButton?: boolean
  showMenuButton?: boolean
  actions?: HeaderAction[]
  backgroundColor?: string
  textColor?: string
  statusBarStyle?: "light" | "dark"
  centerContent?: React.ReactNode
  leftContent?: React.ReactNode
  rightContent?: React.ReactNode
}

export const CustomHeader: React.FC<CustomHeaderProps> = ({
  title,
  subtitle,
  showBackButton = false,
  showMenuButton = true,
  actions = [],
  backgroundColor = "#ffffff",
  textColor = "#111827",
  statusBarStyle = "dark",
  centerContent,
  leftContent,
  rightContent,
}) => {
  const navigation = useNavigation()
  const { t } = useTranslation()
  const handleMenuPress = () => {
    navigation.dispatch(DrawerActions.openDrawer())
  }

  const handleBackPress = () => {
    navigation.goBack()
  }


  const renderIcon = (
    iconName: string,
    iconFamily = "Ionicons",
    isSpinner = false,
    size = 24,
    textColor = "#000" // fallback in case textColor isn't in scope
  ) => {
    if (isSpinner) {
      return <ActivityIndicator size="small" color={textColor} />;
    }
    if (iconFamily === "image") {
      return Icon(iconName as any)(24, textColor);
    }
    if (iconFamily === "FontAwesome") {
      return <FontAwesome name={iconName as any} size={size} color={textColor} />;
    }
    if (iconFamily === "AntDesign") {
      return <AntDesign name={iconName as any} size={size} color={textColor} />;
    }
    if (iconFamily === "MaterialIcons") {
      return <MaterialIcons name={iconName as any} size={size} color={textColor} />;
    }
    return <Ionicons name={iconName as any} size={size} color={textColor} />;
  };


  return (

    <View style={[styles.header]}>
      {/* Left Section */}
      <View style={styles.leftSection}>
        {leftContent ??
          <>
            {showMenuButton && (
              <TouchableOpacity style={styles.iconButton} onPress={handleMenuPress} activeOpacity={0.7}>
                <Ionicons name="menu" size={24} color={textColor} />
              </TouchableOpacity>
            )}
            {showBackButton && (
              <TouchableOpacity style={styles.iconButton} onPress={handleBackPress} activeOpacity={0.7}>
                <Ionicons name="arrow-back" size={24} color={textColor} />
              </TouchableOpacity>
            )}
          </>
        }
      </View>

      {/* Center Section */}
      <View style={styles.centerSection}>
        {centerContent ?? (
          <View style={styles.titleContainer}>
            <Text style={[styles.title, { color: textColor }]} numberOfLines={1}>
              {t(title)}
            </Text>
            {subtitle && (
              <Text style={[styles.subtitle, { color: textColor }]} numberOfLines={1}>
                {t(subtitle)}
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Right Section */}
      <View style={styles.rightSection}>
        {rightContent ??
          <View style={styles.actionsContainer}>
            {actions.map((action) => (
              <TouchableOpacity
                key={`${action.iconFamily ?? "Ionicons"}-${action.icon}${action.label ? `-${action.label}` : ""}`}
                style={styles.iconButton}
                onPress={action.onPress}
                activeOpacity={0.7}
              >
                {renderIcon(action.icon, action.iconFamily, action.isSpinner)}
              </TouchableOpacity>
            ))}
          </View>
        }
      </View>
    </View>

  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 4,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    justifyContent: "flex-start",
  },
  centerSection: {
    flex: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    justifyContent: "flex-end",
  },
  titleContainer: {
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 12,
    opacity: 0.7,
    textAlign: "center",
    marginTop: 2,
  },
  iconButton: {
    padding: 8,
    borderRadius: 20,
    marginHorizontal: 4,
  },
  actionsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
})
