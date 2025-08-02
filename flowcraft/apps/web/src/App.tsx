import React, { Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Loading from './components/Loading'
import { ProtectedRoute } from './components/ProtectedRoute'
import { useAuthStore } from './stores/authStore'

// Lazy load components
const LandingPage = React.lazy(() => import('./components/LandingPage').then(module => ({ default: module.LandingPage })))
const Dashboard = React.lazy(() => import('./components/Dashboard'))
const WorkflowEditor = React.lazy(() => import('./components/WorkflowEditor'))
const Auth = React.lazy(() => import('./components/Auth'))
const UserProfile = React.lazy(() => import('./components/UserProfile').then(module => ({ default: module.UserProfile })))

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Suspense fallback={<Loading />}>
        <Routes>
          {/* Public routes */}
          <Route 
            path="/" 
            element={<LandingPage />} 
          />
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
    </div>
  )
}

export default App 