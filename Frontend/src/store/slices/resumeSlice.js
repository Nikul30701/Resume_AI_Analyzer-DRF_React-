import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as api from '../../services/api';

// Initial state
const initialState = {
  // Upload state
  currentUpload: null, // { status, progress, data, error }
  uploadLoading: false,
  uploadError: null,

  // Resume history
  history: [],
  historyLoading: false,
  historyError: null,

  // Current resume detail
  currentResume: null,
  detailLoading: false,
  detailError: null,

  // Delete state
  deleteLoading: false,
  deleteError: null,
};

// Slice
const resumeSlice = createSlice({
  name: 'resume',
  initialState,
  reducers: {
    clearUploadError: (state) => {
      state.uploadError = null;
    },
    clearHistoryError: (state) => {
      state.historyError = null;
    },
    clearDetailError: (state) => {
      state.detailError = null;
    },
    clearDeleteError: (state) => {
      state.deleteError = null;
    },
    clearCurrentUpload: (state) => {
      state.currentUpload = null;
    },
    clearCurrentResume: (state) => {
      state.currentResume = null;
    },
    setUploadProgress: (state, action) => {
      if (state.currentUpload) {
        state.currentUpload.progress = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    // Upload Resume
    builder
      .addCase(uploadResume.pending, (state) => {
        state.uploadLoading = true;
        state.uploadError = null;
        state.currentUpload = {
          status: 'uploading',
          progress: 0,
        };
      })
      .addCase(uploadResume.fulfilled, (state, action) => {
        state.uploadLoading = false;
        state.currentUpload = {
          status: 'success',
          data: action.payload,
          progress: 100,
        };
        // Prepend to history so it appears at the top
        const existing = Array.isArray(state.history) ? state.history : [];
        state.history = [action.payload, ...existing];
      })
      .addCase(uploadResume.rejected, (state, action) => {
        state.uploadLoading = false;
        state.uploadError = action.payload;
        state.currentUpload = {
          status: 'error',
          error: action.payload,
          progress: 0,
        };
      });

    // Fetch History
    builder
      .addCase(fetchResumeHistory.pending, (state) => {
        state.historyLoading = true;
        state.historyError = null;
      })
      .addCase(fetchResumeHistory.fulfilled, (state, action) => {
        state.historyLoading = false;
        // If your backend returns { results: [...] }
        state.history = Array.isArray(action.payload)
          ? action.payload
          : action.payload.results || [];
      })
      .addCase(fetchResumeHistory.rejected, (state, action) => {
        state.historyLoading = false;
        state.historyError = action.payload;
      });

    // Fetch Detail
    builder
      .addCase(fetchResumeDetail.pending, (state) => {
        state.detailLoading = true;
        state.detailError = null;
      })
      .addCase(fetchResumeDetail.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.currentResume = action.payload;
      })
      .addCase(fetchResumeDetail.rejected, (state, action) => {
        state.detailLoading = false;
        state.detailError = action.payload;
      });

    // Delete Resume
    builder
      .addCase(deleteResume.pending, (state) => {
        state.deleteLoading = true;
        state.deleteError = null;
      })
      .addCase(deleteResume.fulfilled, (state, action) => {
        state.deleteLoading = false;
        // Remove from history
        state.history = state.history.filter(r => r.id !== action.payload);
        // Clear current if it matches
        if (state.currentResume?.id === action.payload) {
          state.currentResume = null;
        }
      })
      .addCase(deleteResume.rejected, (state, action) => {
        state.deleteLoading = false;
        state.deleteError = action.payload;
      });
  },
});

export const {
  clearUploadError,
  clearHistoryError,
  clearDetailError,
  clearDeleteError,
  clearCurrentUpload,
  clearCurrentResume,
  setUploadProgress,
} = resumeSlice.actions;

// Move thunks below to avoid TEMPORAL DEAD ZONE with actions
export const uploadResume = createAsyncThunk(
  'resume/upload',
  async (file, { rejectWithValue, dispatch }) => {
    try {
      const response = await api.uploadResume(file, {
        onUploadProgress: (progressEvent) => {
          const percent = progressEvent.total
            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
            : 0;
          dispatch(setUploadProgress(percent));
        },
      });

      let data = response.data;

      // Poll until the analysis background task completes
      while (data.status === 'pending' || data.status === 'processing') {
          await new Promise(resolve => setTimeout(resolve, 2000));
          const detailRes = await api.getResumeDetail(data.id);
          data = detailRes.data;
      }

      if (data.status === 'failed') {
          const serverMessage = data.weaknesses?.[0] || data.full_feedback?.message;
          const message = serverMessage
            ? (typeof serverMessage === 'string' ? serverMessage : "Analysis failed.")
            : "Analysis failed. Please try a different PDF or check server logs.";
          return rejectWithValue(message);
      }

      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error ?? error.message ?? "Upload failed");
    }
  }
);

export const fetchResumeHistory = createAsyncThunk(
  'resume/fetchHistory',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.getResumesHistory();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error ?? error.message ?? 'Failed to fetch history');
    }
  }
);

export const fetchResumeDetail = createAsyncThunk(
  'resume/fetchDetail',
  async (resumeId, { rejectWithValue }) => {
    try {
      const response = await api.getResumeDetail(resumeId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error ?? error.message ?? 'Failed to fetch resume');
    }
  }
);

export const deleteResume = createAsyncThunk(
  'resume/delete',
  async (resumeId, { rejectWithValue }) => {
    try {
      await api.deleteResume(resumeId);
      return resumeId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error ?? error.message ?? 'Failed to delete resume');
    }
  }
);

export default resumeSlice.reducer;