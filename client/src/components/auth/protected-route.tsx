import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { Loader2 } from 'lucide-react';

import { GET_ME } from '@/graphql/queries';
import { useAuthStore } from '@/store/auth-store';
import type { MeQueryResponse } from '@/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation();
  const { isAuthenticated, token, setUser, logout } = useAuthStore();

  const { loading, error } = useQuery<MeQueryResponse>(GET_ME, {
    skip: !token || !isAuthenticated,
    onCompleted: (data) => {
      setUser(data.me);
    },
    onError: (error) => {
      console.error('Auth verification failed:', error);
      logout();
    },
  });

  // If no token, redirect to login
  if (!token || !isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Show loading while verifying token
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm text-muted-foreground">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // If there's an error, redirect to login
  if (error) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
