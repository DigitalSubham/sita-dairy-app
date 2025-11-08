import { Feather, FontAwesome } from "@expo/vector-icons"
import type React from "react"
import { useTranslation } from "react-i18next"
import { Alert, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native"
import { SettingsHeader } from "./HeaderVarients"

interface SettingsProps {
  handleSignOut: () => void
  handleDeleteAccount: () => void
  notifications: boolean
  setNotifications: (value: boolean) => void
  emailUpdates: boolean
  setEmailUpdates: (value: boolean) => void
}

const SettingsComponent: React.FC<SettingsProps> = ({
  handleSignOut,
  handleDeleteAccount,
  notifications,
  setNotifications,
  emailUpdates,
  setEmailUpdates,
}) => {
  const { t } = useTranslation()
  const showDeleteAccountAlert = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: handleDeleteAccount,
        },
      ],
      { cancelable: true },
    )
  }

  return (
    <View style={styles.container}  >
      <SettingsHeader />
      <View style={styles.content}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t("settings.preferences")}</Text>
          </View>

          <View style={styles.card}>
            <SettingItem
              icon={<FontAwesome name="bell" size={20} color="#6b7280" />}
              label="Push Notifications"
              description="Receive notifications about activity"
              value={notifications}
              onValueChange={setNotifications}
            />

            <View style={styles.divider} />

            <SettingItem
              icon={<Feather name="mail" size={20} color="#6b7280" />}
              label="Email Updates"
              description="Get the latest news via email"
              value={emailUpdates}
              onValueChange={setEmailUpdates}
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t("settings.account")}</Text>
          </View>

          <TouchableOpacity
            style={styles.signOutButton}
            onPress={handleSignOut}
            activeOpacity={0.8}
            accessibilityRole="button"
          >
            <Feather name="log-out" size={20} color="#dc2626" style={styles.signOutIcon} />
            <Text style={styles.signOutText}>{t("auth.sign_out")}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteAccountButton}
            onPress={showDeleteAccountAlert}
            activeOpacity={0.8}
            accessibilityRole="button"
          >
            <Feather name="trash-2" size={20} color="#ffffff" style={styles.deleteAccountIcon} />
            <Text style={styles.deleteAccountText}>{("settings.delete_account")}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t("settings.about")}</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.aboutItem}>
              <Feather name="info" size={20} color="#6b7280" style={styles.aboutIcon} />
              <View>
                <Text style={styles.aboutTitle}>{("settings.version")}</Text>
                <Text style={styles.aboutDescription}>1.0.0</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.aboutItem}>
              <Text style={styles.aboutText}>{("settings.built_by")}</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  )
}

interface SettingItemProps {
  icon?: React.ReactNode
  label: string
  description?: string
  value: boolean
  onValueChange: (value: boolean) => void
}

const SettingItem: React.FC<SettingItemProps> = ({ icon, label, description, value, onValueChange }) => (
  <View style={styles.settingItem}>
    {icon && <View style={styles.iconContainer}>{icon}</View>}
    <View style={styles.settingInfo}>
      <Text style={styles.settingLabel}>{label}</Text>
      {description && <Text style={styles.settingDescription}>{description}</Text>}
    </View>
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: "#e5e7eb", true: "#3b82f6" }}
      thumbColor={value ? "#ffffff" : "#9ca3af"}
      ios_backgroundColor="#e5e7eb"
    />
  </View>
)

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#f3f4f6",
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  iconContainer: {
    marginRight: 16,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: "#6b7280",
  },
  divider: {
    height: 1,
    backgroundColor: "#f3f4f6",
    marginHorizontal: 20,
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    marginTop: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#f3f4f6",
  },
  signOutIcon: {
    marginRight: 12,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#dc2626",
  },
  deleteAccountButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#dc2626",
    borderRadius: 16,
    marginTop: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  deleteAccountIcon: {
    marginRight: 12,
  },
  deleteAccountText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  aboutItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  aboutIcon: {
    marginRight: 16,
  },
  aboutTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  aboutDescription: {
    fontSize: 14,
    color: "#6b7280",
  },
  aboutText: {
    fontSize: 15,
    color: "#111827",
    textAlign: "center",
    width: "100%",
  },
})

export default SettingsComponent
