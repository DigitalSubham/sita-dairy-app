
import MilkBuyRecords from '@/components/admin/milkRecords/milkBuyRecords'
import MilkSaleRecords from '@/components/admin/milkRecords/milkSaleRecords'
import { RecordsHeader } from '@/components/common/HeaderVarients'
import { MilkEntry } from '@/constants/types'
import React, { useState } from 'react'
import { StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const RecordScreen = () => {
  const [entryType, setEntryType] = useState("Milk Buy")
  const [recordData, setRecordData] = useState<MilkEntry[]>([])
  return (
    <SafeAreaView style={styles.container}>
      <RecordsHeader entryType={entryType} setEntryType={setEntryType} entryData={recordData} />
      {entryType === "Milk Buy"
        ? <MilkBuyRecords onEntriesChange={setRecordData} />
        : <MilkSaleRecords onEntriesChange={setRecordData} />}
    </SafeAreaView>

  )
}

export default RecordScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  }
})
