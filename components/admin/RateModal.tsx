import { stringNumber } from '@/constants/types'
import React, { useEffect, useState } from 'react'
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { TextInput } from 'react-native-gesture-handler'

type props = {
    visible: boolean
    setVisible: (value: boolean) => void
    textValue?: stringNumber
    submitFn: (value: string) => void
    modalheadertext: string
}

const RateModal = ({
    visible,
    setVisible,
    textValue,
    submitFn,
    modalheadertext
}: props) => {
    const [text, setText] = useState<stringNumber>("")
    useEffect(() => { if (textValue) setText(textValue) }, [textValue])
    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={{
                flex: 1,
                backgroundColor: "rgba(0,0,0,0.4)",
                justifyContent: "center",
                alignItems: "center"
            }}>
                <View style={{
                    backgroundColor: "white",
                    padding: 20,
                    borderRadius: 10,
                    width: "80%"
                }}>
                    <Text style={{ fontWeight: "600", marginBottom: 8 }}>
                        {modalheadertext}
                    </Text>

                    <TextInput
                        placeholder="Enter column name"
                        value={String(text)}
                        onChangeText={setText}
                        style={{
                            borderWidth: 1,
                            borderColor: "#e2e8f0",
                            borderRadius: 6,
                            padding: 10,
                            marginBottom: 12,
                        }}
                    />

                    <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 10 }}>
                        <TouchableOpacity onPress={() => setVisible(false)}>
                            <Text style={{ color: "#64748b" }}>Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => {
                            submitFn(String(text))
                            setText("")
                        }}>
                            <Text style={{ color: "#0ea5e9", fontWeight: "600" }}>Add</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    )
}

export default RateModal

const styles = StyleSheet.create({})