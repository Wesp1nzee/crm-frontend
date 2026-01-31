import { Navigate } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { data: user, isLoading, error, isError } = useAuth();

  // Проверяем, является ли ошибка ошибкой аутентификации
  const isAuthError = isError && (error as any)?.response?.status === 401;

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  // Если есть ошибка аутентификации или нет пользователя
  if (isAuthError || !user) {
    return <Navigate to="/login" replace />;
  }

  // Проверка дополнительного условия
  if (!user?.can_authenticate) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}