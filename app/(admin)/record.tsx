
import MilkBuyRecords from '@/components/admin/milkRecords/milkBuyRecords'
import MilkSaleRecords from '@/components/admin/milkRecords/milkSaleRecords'
import { RecordsHeader } from '@/components/common/HeaderVarients'
import React, { useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { useSelector } from 'react-redux'

const MilkEntry = () => {
  const [entryType, setEntryType] = useState("Milk Buy")
  const recordData = useSelector((state: any) => state.record.recordData)
  return (
    <View style={styles.container}>
      <RecordsHeader entryType={entryType} setEntryType={setEntryType} entryData={recordData} />
      {entryType === "Milk Buy" ? <MilkBuyRecords /> : <MilkSaleRecords />}
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