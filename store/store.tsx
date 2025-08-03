import { configureStore } from '@reduxjs/toolkit';
import recordReducer from './recordSlice'; // Import your record slice
import userReducer from './userSlice'; // Import your user slice

const store = configureStore({
  reducer: {
    user: userReducer,
    record: recordReducer

  },
});

// Define RootState and AppDispatch for TypeScript support
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
