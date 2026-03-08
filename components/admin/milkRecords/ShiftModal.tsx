import ModalWrapper from '@/components/common/ModalWrapper'
import { ShiftType } from '@/constants/types'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, TouchableOpacity } from 'react-native'

type Props = {
    showShiftModal: boolean
    selectedShift: ShiftType | ""
    setSelectedShift: (shift: ShiftType) => void
    setShowShiftModal: (value: boolean) => void
}


const shifts: { value: '' | ShiftType.Morning | ShiftType.Evening }[] = [
    { value: '' },
    { value: ShiftType.Morning },
    { value: ShiftType.Evening },
]

const ShiftModal = ({
    showShiftModal,
    selectedShift,
    setSelectedShift,
    setShowShiftModal,
}: Props) => {
    const { t } = useTranslation()
    return (
        <ModalWrapper
            headerText={t("entry.select_shift")}
            visible={showShiftModal}
            setVisibility={setShowShiftModal}
        >
            <>
                {shifts.map(({ value }) => (
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
                        <Text style={styles.optionText}>
                            {value === ""
                                ? t("records.all_shifts")
                                : value === ShiftType.Morning
                                    ? t("entry.morning")
                                    : t("entry.evening")}
                        </Text>
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
