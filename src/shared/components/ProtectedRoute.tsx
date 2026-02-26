import { Navigate } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';
import { useAuth } from '../hooks/useAuth';
import { useMemo } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { data: user, isLoading, error } = useAuth();

  const isUnauthenticated = useMemo(() => {
    if (isLoading) return false;
    if (!user) return true;
    if (!user?.can_authenticate) return true;
    
    const errorStatus = (error as any)?.message?.includes('401');
    return errorStatus;
  }, [user, isLoading, error]);

  if (user?.id && user?.can_authenticate) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (isUnauthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}