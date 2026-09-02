import {
  createAsyncThunk,
  createSlice,
} from "@reduxjs/toolkit";

import {
  getMe,
  LoginUser,
  LogoutUser,
  
} from "../../services/authService";

import type{AuthUser,
  LoginData} from "../../services/authService";
import { getErrorMessage } from "../../utils/getErrorMessage";
import { mergeGuestCart } from "../../services/cartService";

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  initialized: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  loading: false,
  initialized: false,
  error: null,
};

export const login = createAsyncThunk<
  AuthUser,
  LoginData,
  { rejectValue: string }
>(
  "auth/login",
  async (data, { rejectWithValue }) => {
    try {
      const response = await LoginUser(data);

      try {
        await mergeGuestCart();
      } catch (mergeError) {
        console.error("Guest cart merge failed:", mergeError);
      }

      return response.user;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, "Login failed"));
    }
  }
);

export const fetchCurrentUser =
  createAsyncThunk(
    "auth/getMe",
    async (_, { rejectWithValue }) => {
      try {
        return await getMe();
      } catch (error: unknown) {
        return rejectWithValue(getErrorMessage(error, "Not authenticated"));
      }
    }
  );

  export const logout = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      await LogoutUser();
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, "Logout failed"));
    }
  }
);

const authSlice = createSlice({
  name: "auth",

  initialState,

  reducers: {
    clearAuthError: (state) => {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder

      // LOGIN
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.error = null;
        state.initialized = true;
      })

      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload as string;
        state.initialized = true;
      })

      // GET ME
      .addCase(
        fetchCurrentUser.pending,
        (state) => {
          state.loading = true;
        }
      )

      .addCase(
        fetchCurrentUser.fulfilled,
        (state, action) => {
          state.loading = false;
          state.user = action.payload;
          state.initialized = true;
        }
      )

      .addCase(
        fetchCurrentUser.rejected,
        (state) => {
          state.loading = false;
          state.user = null;
          
          state.initialized = true;
        }
      )

      // LOGOUT
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.loading = false;
        state.error = null;
        state.initialized = true;
      });
  },
});

export const {
  clearAuthError,
} = authSlice.actions;

export default authSlice.reducer;
