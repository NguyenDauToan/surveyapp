import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";

// Tạo Redux store
export const store = configureStore({
  reducer: {
    auth: authReducer, // thêm các slice reducer vào đây
  },
});

// Infer type của RootState từ store
export type RootState = ReturnType<typeof store.getState>;

// Infer type của AppDispatch từ store
export type AppDispatch = typeof store.dispatch;
