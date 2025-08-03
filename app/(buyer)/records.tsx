import AnimatedComingSoon from '@/components/comingSoon'
import { BuyerDashboardHeader } from '@/components/common/HeaderVarients'
import React from 'react'
import { StyleSheet, View } from 'react-native'

const records = () => {
    return (
        <View style={styles.container}>
            <BuyerDashboardHeader title="Subcription" desc="Subscrbed to products" />
            <AnimatedComingSoon />
        </View>
    )
}

export default records

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F8FAFC", // Light gray background
    },
})