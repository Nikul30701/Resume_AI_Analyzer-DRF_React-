import React, { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Upload from './pages/Upload'
import History from './pages/History'
import { useAuth, useAppDispatch } from './store/hooks'
import { getProfile } from './store/slices/authSlice'
import './App.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#FBFBFB]">
       <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
    </div>
  );
  
  if (!isAuthenticated) return <Navigate to="/login" />;
  
  return children;
};

const App = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      dispatch(getProfile());
    }
  }, [dispatch]);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      <Route 
        path="/upload" 
        element={
          <ProtectedRoute>
            <Upload />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/history" 
        element={
          <ProtectedRoute>
            <History />
          </ProtectedRoute>
        } 
      />

      {/* Redirect root to upload if authenticated, otherwise login */}
      <Route path="/" element={<Navigate to={isAuthenticated ? "/upload" : "/login"} />} />
      
      {/* Fallback for undefined routes */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

export default App;