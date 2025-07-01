import { MaterialIcons } from '@expo/vector-icons'
import React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'


type RoleCheckBoxProps = {
    handleRoleChange: () => void
    isSelected: boolean
    isModified: boolean
    canRemoveModification?: boolean | "User" | "Farmer" | "Buyer"
    label: string
}
const RoleCheckBox: React.FC<RoleCheckBoxProps> = ({ handleRoleChange, isSelected, isModified, canRemoveModification, label }) => {
    return (
        <TouchableOpacity
            style={[
                styles.checkboxContainer,
                isSelected && styles.checkboxSelected,
                isModified && styles.checkboxModified,
                canRemoveModification && styles.checkboxRemovable,
            ]}
            onPress={handleRoleChange}
            activeOpacity={0.7}
        >
            <View style={[styles.checkbox, isSelected && styles.checkboxChecked]}>
                {isSelected && <MaterialIcons name="check" size={12} color="#ffffff" />}
            </View>
            <Text style={[styles.checkboxLabel, isSelected && styles.checkboxLabelSelected]}>{label}</Text>
            {isModified && (
                <View style={styles.modifiedIndicator}>
                    <MaterialIcons name="edit" size={10} color="#f59e0b" />
                </View>
            )}
        </TouchableOpacity>
    )
}

export default RoleCheckBox

const styles = StyleSheet.create({
    checkboxContainer: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#e2e8f0",
        backgroundColor: "#ffffff",
        flex: 1,
        marginHorizontal: 2,
        position: "relative",
    },
    checkboxSelected: {
        borderColor: "#3b82f6",
        backgroundColor: "#eff6ff",
    },
    checkboxModified: {
        borderColor: "#f59e0b",
        backgroundColor: "#fffbeb",
    },
    checkboxRemovable: {
        borderStyle: "dashed",
    },
    checkbox: {
        width: 16,
        height: 16,
        borderRadius: 3,
        borderWidth: 1.5,
        borderColor: "#d1d5db",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 6,
    },
    checkboxChecked: {
        backgroundColor: "#3b82f6",
        borderColor: "#3b82f6",
    },
    checkboxLabel: {
        fontSize: 12,
        color: "#64748b",
        fontWeight: "500",
        flex: 1,
        textAlign: "center",
    },
    checkboxLabelSelected: {
        color: "#3b82f6",
        fontWeight: "600",
    },
    modifiedIndicator: {
        position: "absolute",
        top: -4,
        right: -4,
        backgroundColor: "#f59e0b",
        borderRadius: 8,
        padding: 2,
    },
})