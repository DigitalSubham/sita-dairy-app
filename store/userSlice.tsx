import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UserState {
  _id?: string;
  id?: string;
  name?: string;
  mobile?: string;
  collectionCenter?: string;
  dailryName?: string;
  fatherName?: string;
  role?: string;
  isVerified?: boolean;
  profilePic?: string;
  createdAt?: string;
  address: string;
}

const initialState: UserState = {
  _id: "",
  name: "Good Boy",
  mobile: "8210243998",
  collectionCenter: "Bad Boy",
  dailryName: "dailryName",
  fatherName: "fatherName",
  role: "Admin",
  isVerified: false,
  createdAt: "2025-05-20T17:07:32.815Z",
  profilePic:
    "https://res.cloudinary.com/dskra60sa/image/upload/v1743086699/man_rqv4zk.png",
  address: "Jogiya, Nadiyama, Goradih, Bhagalpur , Bihar",
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setReduxUser: (state, action: PayloadAction<UserState>) => {
      return { ...state, ...action.payload };
    },
    updateProfilePicture: (state, action: PayloadAction<string>) => {
      state.profilePic = action.payload;
    },
    logout: () => initialState,
  },
});

export const { setReduxUser, updateProfilePicture, logout } = userSlice.actions;
export default userSlice.reducer;
