import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import * as api from '../../services/api';

// async thunks
export const register = createAsyncThunk(
    'auth/register',
    async({email, username, password, passwordConfirm}, {rejectWithValue}) => {
        try {
            const response = await api.register(email, username, password, passwordConfirm);

            // save token to localStorage
            localStorage.setItem('access_token', response.data.access);
            localStorage.setItem('refresh_token', response.data.refresh);

            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.detail || 'Registration failed');
        }
    }
);

export const login = createAsyncThunk(
    'auth/login',
    async({email, password}, {rejectWithValue}) => {
        try {
            const response = await api.login(email, password);

            // save token to localStorage
            localStorage.setItem('access_token', response.data.access);
            localStorage.setItem('refresh_token', response.data.refresh);

            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.detail || 'Login failed');
        }
    }
)

export const getProfile = createAsyncThunk(
    'auth/getProfile',
    async(_ , {rejectWithValue}) => {
        try {
            const response = await api.getProfile();
            return response.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.detail || "Failed to fetch profile")
        }
    }
)

export const logout = createAsyncThunk(
    'auth/logout',
    async(_, { rejectWithValue }) => {
        try {
            const refreshToken = localStorage.getItem("refresh_token");

            if (refreshToken) {
                await api.logout({refresh: refreshToken});
            }

            // clear tokens
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');

            return {message: 'Logout successful'};
        } catch (err) {
            // even if logout fails remotely, clear tokens locally
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            return rejectWithValue(err.response?.data?.detail || 'Logout failed remotely');
        }
    }
)

// Initial state
const initialState = {
    user:null, 
    isAuthenticated: false,
    loading: false,
    error: null,
    message: '',
};

// Auth slice
const authSlice = createSlice({
    name:'auth',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        clearMessage: (state) => {
            state.message = '';
        },
        setUser: (state, action) => {
            state.user = action.payload;
            state.isAuthenticated = true;
        },
        setLogout: (state) => {
            state.user = null;
            state.isAuthenticated = false;
        }
    },
    extraReducers: (builder) => {
        // Register
        builder.addCase(register.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(register.fulfilled, (state, action) => {
            state.loading = false;
            state.user = action.payload;
            state.isAuthenticated = true;
            state.message = 'Registration successful';
        })
        .addCase(register.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
        })

        // Login
        builder.addCase(login.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(login.fulfilled, (state) => {
            state.loading = false;
            state.isAuthenticated = true;
            state.message = 'Login successful';
        })
        .addCase(login.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
        })

        // Get Profile
        builder.addCase(getProfile.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(getProfile.fulfilled, (state, action) => {
            state.loading = false;
            state.user = action.payload;
            state.isAuthenticated = true;
        })
        .addCase(getProfile.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
            state.user = null;
            state.isAuthenticated = false;
        })

        // Logout
        builder.addCase(logout.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(logout.fulfilled, (state) => {
            state.loading = false;
            state.user = null;
            state.isAuthenticated = false;
            state.message = 'Logout successful';
        })
        .addCase(logout.rejected, (state, action) => {
            state.loading = false;
            // Optionally set error, but we still treat user as logged out locally
            state.user = null;
            state.isAuthenticated = false;
            state.error = action.payload;
        })
    }
});

export const {clearError, clearMessage, setUser, setLogout} = authSlice.actions;
export default authSlice.reducer;