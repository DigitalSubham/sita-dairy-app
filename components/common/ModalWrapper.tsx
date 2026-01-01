import { MaterialIcons } from '@expo/vector-icons';
import React, { ReactNode } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type props = {
    children: ReactNode
    visible: boolean
    setVisibility: (value: boolean) => void
    headerText: string
}

const ModalWrapper = ({ children, visible, setVisibility, headerText }: props) => {
    return (
        <Modal visible={visible} transparent animationType="fade" statusBarTranslucent={true} onRequestClose={() => setVisibility(false)}>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>{headerText}</Text>
                        <TouchableOpacity onPress={() => setVisibility(false)}>
                            <MaterialIcons name="close" size={20} color="#64748b" />
                        </TouchableOpacity>
                    </View>
                    {children}
                </View>
            </View>
        </Modal>
    )
}

export default ModalWrapper

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "center",
        alignItems: "center",
    },
    modalContent: {
        backgroundColor: "#fff",
        borderRadius: 12,
        margin: 20,
        width: "80%",
        maxHeight: "60%",
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#f1f5f9",
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#334155",
    },

})