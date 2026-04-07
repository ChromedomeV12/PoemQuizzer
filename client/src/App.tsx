import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ProfileSetupPage } from './pages/ProfileSetupPage';
import { DashboardPage } from './pages/DashboardPage';
import { QuizPage } from './pages/QuizPage';
import { ResultsPage } from './pages/ResultsPage';
import { AdminPage } from './pages/AdminPage';
import { useAuthStore, initializeAuth } from './store/authStore';
import { getToken } from './services/api';

// Protected route wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode; requireProfile?: boolean; requireAdmin?: boolean }> = ({
  children,
  requireProfile = true,
  requireAdmin = false,
}) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireProfile && !user?.profileComplete) {
    return <Navigate to="/profile-setup" replace />;
  }

  if (requireAdmin && user?.role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

function App() {
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    async function init() {
      const token = getToken();
      if (token) {
        await initializeAuth();
      }
      setIsInitializing(false);
    }
    init();
  }, []);

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <span className="text-5xl">📝</span>
          <div className="mt-4">
            <svg className="animate-spin h-8 w-8 mx-auto text-primary-500" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected routes */}
      <Route
        path="/profile-setup"
        element={
          <ProtectedRoute requireProfile={false}>
            <ProfileSetupPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/quiz"
        element={
          <ProtectedRoute>
            <QuizPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/results"
        element={
          <ProtectedRoute>
            <ResultsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute requireAdmin>
            <AdminPage />
          </ProtectedRoute>
        }
      />

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
