import { MilkEntry } from "@/components/admin/milkRecords/milkBuyRecords"
import { createSlice, PayloadAction } from "@reduxjs/toolkit"

// 1. Define the shape of your slice state
interface RecordState {
    // adjust this to whatever shape `recordData` really is
    recordData: MilkEntry[]
}

// 2. Provide an initialState
const initialState: RecordState = {
    recordData: [] as MilkEntry[],
}

// 3. Create the slice, with a properly typed PayloadAction
const recordSlice = createSlice({
    name: "record",
    initialState,
    reducers: {
        setRecordData(
            state,
            action: PayloadAction<MilkEntry[]>
        ) {
            state.recordData = action.payload

        },
    },
})

export const { setRecordData } = recordSlice.actions
export default recordSlice.reducer
