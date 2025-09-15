import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// Kiểu dữ liệu User
export interface User {
  id?: string | number;
  ten?: string;
  email?: string;
  role?: string;
  [key: string]: any; // để linh hoạt với backend trả về
}

// Kiểu state auth
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

// Lấy từ localStorage (nếu có)
const savedToken = localStorage.getItem("token");
const savedUser = localStorage.getItem("user");

const initialState: AuthState = {
  user: savedUser ? (JSON.parse(savedUser) as User) : null,
  token: savedToken,
  isAuthenticated: !!savedToken,
};

// Kiểu payload cho login
interface LoginPayload {
  user: User;
  token: string;
  role?: string;
}

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    login: (state, action: PayloadAction<LoginPayload>) => {
      const userWithRole: User = {
        ...action.payload.user,
        role: action.payload.role || action.payload.user.role,
      };

      state.user = userWithRole;
      state.token = action.payload.token;
      state.isAuthenticated = true;

      localStorage.setItem("token", action.payload.token);
      localStorage.setItem("user", JSON.stringify(userWithRole));
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    },
  },
});

export const { login, logout } = authSlice.actions;
export default authSlice.reducer;
