import { Feather, FontAwesome } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface ErrorViewProps {
  message: string;
  onRetry: () => void;
}

export function ErrorView({ message, onRetry }: ErrorViewProps) {
  return (
    <View style={styles.container}>
      <Feather name="alert-circle" size={48} color="#ef4444" />
      <Text style={styles.message}>{message}</Text>
      <Pressable
        style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}
        onPress={onRetry}
      >
        <FontAwesome name="refresh" size={20} color="white" />
        <Text style={styles.retryText}>Try Again</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  message: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginVertical: 16,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0891b2",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  pressed: {
    opacity: 0.7,
  },
  retryText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
