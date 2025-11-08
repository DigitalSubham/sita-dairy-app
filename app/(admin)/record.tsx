
import MilkBuyRecords from '@/components/admin/milkRecords/milkBuyRecords'
import MilkSaleRecords from '@/components/admin/milkRecords/milkSaleRecords'
import { RecordsHeader } from '@/components/common/HeaderVarients'
import React, { useState } from 'react'
import { StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useSelector } from 'react-redux'

const MilkEntry = () => {
  const [entryType, setEntryType] = useState("Milk Buy")
  const recordData = useSelector((state: any) => state.record.recordData)
  return (
    <SafeAreaView style={styles.container}>
      <RecordsHeader entryType={entryType} setEntryType={setEntryType} entryData={recordData} />
      {entryType === "Milk Buy" ? <MilkBuyRecords /> : <MilkSaleRecords />}
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