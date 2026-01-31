import { Navigate } from 'react-router-dom';
import { usePermissions } from '../hooks/usePermissions';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  redirectTo?: string;
}

export function RoleGuard({ children, allowedRoles, redirectTo = '/' }: RoleGuardProps) {
  const { user } = usePermissions();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}