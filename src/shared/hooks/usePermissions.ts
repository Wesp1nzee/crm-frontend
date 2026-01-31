import { useAuth } from './useAuth';
import { ROLE_PERMISSIONS, RESTRICTED_ROUTES_FOR_EXPERT, type UserRole } from '../types/auth';

export const usePermissions = () => {
  const { data: user } = useAuth();

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    
    const userPermissions = ROLE_PERMISSIONS[user.role as UserRole];
    return userPermissions.includes('all') || userPermissions.includes(permission);
  };

  const canAccessRoute = (route: string): boolean => {
    if (!user) return false;
    
    if (user.role === 'expert') {
      return !RESTRICTED_ROUTES_FOR_EXPERT.some(restrictedRoute => 
        route.startsWith(restrictedRoute)
      );
    }
    
    return true;
  };

  const isExpert = user?.role === 'expert';
  const isAdmin = user?.role === 'admin';
  const isCEO = user?.role === 'ceo';
  const isAccountant = user?.role === 'accountant';

  return {
    user,
    hasPermission,
    canAccessRoute,
    isExpert,
    isAdmin,
    isCEO,
    isAccountant,
  };
};