import MilkBuyEntry from '@/components/admin/milkEntry/MilkBuy'
import MilkSaleEntry from '@/components/admin/milkEntry/MilkSale'
import { MilkEntryHeader } from '@/components/common/HeaderVarients'
import React, { useState } from 'react'
import { StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const MilkEntry = () => {
  const [entryType, setEntryType] = useState("Milk Buy")
  return (
    <SafeAreaView style={styles.container}>
      <MilkEntryHeader entryType={entryType} setEntryType={setEntryType} />
      {entryType === "Milk Buy" ? <MilkBuyEntry /> : <MilkSaleEntry />}
    </SafeAreaView>

  )
}

export default MilkEntry

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  }
})