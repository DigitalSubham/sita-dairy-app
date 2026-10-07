
import MilkBuyRecords from '@/components/admin/milkRecords/milkBuyRecords'
import MilkSaleRecords from '@/components/admin/milkRecords/milkSaleRecords'
import { RecordsHeader } from '@/components/common/HeaderVarients'
import { MilkEntry } from '@/constants/types'
import React, { useRef, useState } from 'react'
import { StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const RecordScreen = () => {
  const [entryType, setEntryType] = useState("Milk Buy")
  // The active records screen (Buy or Sell) registers its own "fetch the
  // complete filtered set" function here — the header's export button calls
  // whichever one is currently registered, so export always sees everything
  // matching the active filters, not just what's been scrolled into view.
  const exportHandlerRef = useRef<() => Promise<MilkEntry[]>>(async () => [])
  return (
    <SafeAreaView style={styles.container}>
      <RecordsHeader entryType={entryType} setEntryType={setEntryType} onExportRequest={() => exportHandlerRef.current()} />
      {entryType === "Milk Buy"
        ? <MilkBuyRecords registerExportHandler={(fn) => { exportHandlerRef.current = fn }} />
        : <MilkSaleRecords registerExportHandler={(fn) => { exportHandlerRef.current = fn }} />}
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
