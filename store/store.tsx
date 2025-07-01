import { configureStore } from '@reduxjs/toolkit';
import userReducer from './userSlice'; // Import your user slice

const store = configureStore({
  reducer: {
    user: userReducer,
  },
});

// Define RootState and AppDispatch for TypeScript support
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
