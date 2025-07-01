import MilkBuyEntry from '@/components/admin/milkEntry/MilkBuy'
import MilkSaleEntry from '@/components/admin/milkEntry/MilkSale'
import { MilkEntryHeader } from '@/components/common/HeaderVarients'
import React, { useState } from 'react'
import { StyleSheet, View } from 'react-native'

const MilkEntry = () => {
  const [entryType, setEntryType] = useState("Milk Buy")
  return (
    <View style={styles.container}>
      <MilkEntryHeader entryType={entryType} setEntryType={setEntryType} />
      {entryType === "Milk Buy" ? <MilkBuyEntry /> : <MilkSaleEntry />}
    </View>

  )
}

export default MilkEntry

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  }
})