import React, { useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import Loading from './Loading';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  fallback,
}) => {
  const { isAuthenticated, isLoading, initializeAuth } = useAuthStore();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  if (isLoading) {
    return <Loading />;
  }

  if (!isAuthenticated) {
    return fallback || <div>Please log in to access this page.</div>;
  }

  return <>{children}</>;
};
