import React, { Suspense, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Loading from './components/Loading';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useAuthStore } from './stores/authStore';
import { NotificationCenter } from './components/NotificationCenter';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useNotificationStore } from './stores/notificationStore';

// Lazy load components
const LandingPage = React.lazy(() =>
  import('./components/LandingPage').then(module => ({
    default: module.LandingPage,
  }))
);
const Dashboard = React.lazy(() => import('./components/Dashboard'));
const WorkflowsPage = React.lazy(() => import('./components/WorkflowsPage'));
const WorkflowEditor = React.lazy(() => import('./components/WorkflowEditor'));
const Auth = React.lazy(() => import('./components/Auth'));
const UserProfile = React.lazy(() =>
  import('./components/UserProfile').then(module => ({
    default: module.UserProfile,
  }))
);

function App() {
  const { isAuthenticated, logout } = useAuthStore();
  const { addNotification } = useNotificationStore();
  
  // Enable global keyboard shortcuts
  useKeyboardShortcuts({ enableGlobalShortcuts: true });

  // Listen for authentication expired events
  useEffect(() => {
    const handleAuthExpired = (event: CustomEvent) => {
      const message = event.detail?.message || 'Your session has expired. Please log in again.';
      
      addNotification({
        type: 'warning',
        title: 'Session Expired',
        message: message,
      });
      
      // Logout the user
      logout();
    };

    window.addEventListener('auth:expired', handleAuthExpired as EventListener);
    
    return () => {
      window.removeEventListener('auth:expired', handleAuthExpired as EventListener);
    };
  }, [addNotification, logout]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Suspense fallback={<Loading />}>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/auth"
            element={
              isAuthenticated ? <Navigate to="/dashboard" replace /> : <Auth />
            }
          />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute fallback={<Navigate to="/auth" replace />}>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/workflows"
            element={
              <ProtectedRoute fallback={<Navigate to="/auth" replace />}>
                <WorkflowsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/workflow/new"
            element={
              <ProtectedRoute fallback={<Navigate to="/auth" replace />}>
                <WorkflowEditor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/workflow/:id"
            element={
              <ProtectedRoute fallback={<Navigate to="/auth" replace />}>
                <WorkflowEditor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute fallback={<Navigate to="/auth" replace />}>
                <UserProfile />
              </ProtectedRoute>
            }
          />

          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      
      {/* Global Notification Center */}
      <NotificationCenter />
    </div>
  );
}

export default App;
