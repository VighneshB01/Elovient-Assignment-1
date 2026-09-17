import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../api/axiosInstance';

// Persist auth data to localStorage so the user stays logged in on refresh
const persistAuth = (user, token) => {
  localStorage.setItem('user', JSON.stringify(user));
  localStorage.setItem('token', token);
};

const clearAuth = () => {
  localStorage.removeItem('user');
  localStorage.removeItem('token');
};

// Hydrate from localStorage immediately so the app doesn't flash a login screen
const initialState = {
  user: JSON.parse(localStorage.getItem('user')) || null,
  token: localStorage.getItem('token') || null,
  loading: false,
  error: null,
};

export const signupUser = createAsyncThunk('auth/signup', async (data, thunkAPI) => {
  try {
    const res = await axiosInstance.post('/auth/register', data);
    return res.data;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data?.message || 'Signup failed');
  }
});

export const loginUser = createAsyncThunk('auth/login', async (data, thunkAPI) => {
  try {
    const res = await axiosInstance.post('/auth/login', data);
    return res.data;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data?.message || 'Login failed');
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      clearAuth();
    },
    clearError: (state) => {
      state.error = null;
    },
    // Used by ProfilePage to update the in-memory user without a full page reload
    updateUserProfile: (state, action) => {
      state.user = { ...state.user, ...action.payload };
      localStorage.setItem('user', JSON.stringify(state.user));
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(signupUser.pending,    (state) => { state.loading = true; state.error = null; })
      .addCase(signupUser.fulfilled,  (state, action) => {
        state.loading = false;
        state.user  = action.payload.user;
        state.token = action.payload.token;
        persistAuth(action.payload.user, action.payload.token);
      })
      .addCase(signupUser.rejected,   (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(loginUser.pending,     (state) => { state.loading = true; state.error = null; })
      .addCase(loginUser.fulfilled,   (state, action) => {
        state.loading = false;
        state.user  = action.payload.user;
        state.token = action.payload.token;
        persistAuth(action.payload.user, action.payload.token);
      })
      .addCase(loginUser.rejected,    (state, action) => { state.loading = false; state.error = action.payload; });
  },
});

export const { logout, clearError, updateUserProfile } = authSlice.actions;
export default authSlice.reducer;
