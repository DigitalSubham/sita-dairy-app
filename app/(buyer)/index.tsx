import AnimatedComingSoon from '@/components/comingSoon'
import { BuyerDashboardHeader } from '@/components/common/HeaderVarients'
import React from 'react'
import { StyleSheet, View } from 'react-native'

const BuyerDashboard = () => {
    return (
        <View style={styles.container}>
            <BuyerDashboardHeader title="Buyer Dashboard" />

            <AnimatedComingSoon />
        </View>
    )
}

export default BuyerDashboard

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f8fafc", // Light gray background
    },
})