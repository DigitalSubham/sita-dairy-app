import MilkBuyEntry from '@/components/admin/milkEntry/MilkBuy'
import MilkSaleEntry from '@/components/admin/milkEntry/MilkSale'
import { MilkEntryHeader } from '@/components/common/HeaderVarients'
import React, { useState } from 'react'
import { StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const MilkEntry = () => {
  const [entryType, setEntryType] = useState("Milk Buy")
  const [walletAmount, setWalletAmount] = useState<number | null>(null)

  const handleSetEntryType = (type: string) => {
    setWalletAmount(null)
    setEntryType(type)
  }

  return (
    <SafeAreaView style={styles.container}>
      <MilkEntryHeader entryType={entryType} setEntryType={handleSetEntryType} walletAmount={walletAmount} />
      {entryType === "Milk Buy"
        ? <MilkBuyEntry onWalletAmountChange={setWalletAmount} />
        : <MilkSaleEntry onWalletAmountChange={setWalletAmount} />}
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