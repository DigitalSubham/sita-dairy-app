import { MaterialIcons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

const FilterChip = ({
    title,
    isActive,
    onPress,
    icon,
}: {
    title: string;
    isActive: boolean;
    onPress: () => void;
    icon: string;
}) => (
    <TouchableOpacity
        style={[styles.filterChip, isActive && styles.activeFilterChip]}
        onPress={onPress}
    >
        <MaterialIcons
            name={icon as any}
            size={16}
            color={isActive ? "#fff" : "#0ea5e9"}
        />
        <Text
            style={[styles.filterChipText, isActive && styles.activeFilterChipText]}
        >
            {title}
        </Text>
    </TouchableOpacity>
);

export default FilterChip;

const styles = StyleSheet.create({
    filterChip: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#f8fafc",
        borderWidth: 1,
        borderColor: "#e2e8f0",
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 6,
        gap: 4,
    },
    activeFilterChip: {
        backgroundColor: "#0ea5e9",
        borderColor: "#0ea5e9",
    },
    filterChipText: {
        fontSize: 12,
        color: "#64748b",
        fontWeight: "500",
    },
    activeFilterChipText: {
        color: "#fff",
    },
})
