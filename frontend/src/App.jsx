import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/AuthContext';
import { PrefsProvider } from './lib/PrefsContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';

function ProtectedRoute({ children }) {
  const { token, loading } = useAuth();
  if (loading) return null;
  return token ? children : <Navigate to="/login" replace />;
}

function PublicOnlyRoute({ children }) {
  const { token, loading } = useAuth();
  if (loading) return null;
  return token ? <Navigate to="/" replace /> : children;
}

export default function App() {
  return (
    <PrefsProvider>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <Login />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicOnlyRoute>
                <Register />
              </PublicOnlyRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </PrefsProvider>
  );
}
