import { useDispatch, useSelector } from 'react-redux';

// Auth hooks
export const useAuth = () => {
  return useSelector((state) => state.auth);
};

export const useAuthLoading = () => {
  return useSelector((state) => state.auth.loading);
};

export const useAuthError = () => {
  return useSelector((state) => state.auth.error);
};

export const useCurrentUser = () => {
  return useSelector((state) => state.auth.user);
};

export const useIsAuthenticated = () => {
  return useSelector((state) => state.auth.isAuthenticated);
};

// Resume hooks
export const useResumes = () => {
  return useSelector((state) => state.resumes);
};

export const useResumeHistory = () => {
  return useSelector((state) => state.resumes.history);
};

export const useCurrentResume = () => {
  return useSelector((state) => state.resumes.currentResume);
};

export const useCurrentUpload = () => {
  return useSelector((state) => state.resumes.currentUpload);
};

export const useUploadLoading = () => {
  return useSelector((state) => state.resumes.uploadLoading);
};

export const useHistoryLoading = () => {
  return useSelector((state) => state.resumes.historyLoading);
};

export const useDetailLoading = () => {
  return useSelector((state) => state.resumes.detailLoading);
};

// Dispatch hook
export const useAppDispatch = () => {
  return useDispatch();
};