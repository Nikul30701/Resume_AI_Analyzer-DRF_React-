import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import { useAuth } from './store/hooks'
import './App.css'

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/login" />;
  
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Placeholder for protected routes */}
        <Route 
          path="/upload" 
          element={
            <ProtectedRoute>
              <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
                <h1 className="text-3xl font-bold">Resume Upload Page (Coming Soon)</h1>
              </div>
            </ProtectedRoute>
          } 
        />

        {/* Redirect root to login or upload */}
        <Route path="/" element={<Navigate to="/login" />} />
        
        {/* Registration */}
        <Route path="/register" element={<Register />} />
      </Routes>
    </Router>
  )
}

export default App
