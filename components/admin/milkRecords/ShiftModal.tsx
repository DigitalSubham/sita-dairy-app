import ModalWrapper from '@/components/common/ModalWrapper'
import { ShiftType } from '@/constants/types'
import React from 'react'
import { StyleSheet, Text, TouchableOpacity } from 'react-native'

type Props = {
    showShiftModal: boolean
    selectedShift: ShiftType | ""
    setSelectedShift: (shift: ShiftType) => void
    setShowShiftModal: (value: boolean) => void
}


const shifts: { label: string; value: '' | ShiftType.Morning | ShiftType.Evening }[] = [
    { label: 'All Shifts', value: '' },
    { label: 'Morning', value: ShiftType.Morning },
    { label: 'Evening', value: ShiftType.Evening },
]

const ShiftModal = ({
    showShiftModal,
    selectedShift,
    setSelectedShift,
    setShowShiftModal,
}: Props) => {
    return (
        <ModalWrapper
            headerText="Select Shift"
            visible={showShiftModal}
            setVisibility={setShowShiftModal}
        >
            <>
                {shifts.map(({ label, value }) => (
                    <TouchableOpacity
                        key={value || 'all'}
                        style={[
                            styles.optionItem,
                            selectedShift === value && styles.selectedOption,
                        ]}
                        onPress={() => {
                            setSelectedShift(value as ShiftType)
                            setShowShiftModal(false)
                        }}
                    >
                        <Text style={styles.optionText}>{label}</Text>
                    </TouchableOpacity>
                ))}
            </>
        </ModalWrapper>
    )
}

export default ShiftModal


const styles = StyleSheet.create({
    optionItem: {
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    selectedOption: {
        backgroundColor: '#f0f9ff',
    },
    optionText: {
        fontSize: 14,
        color: '#334155',
    },
})
