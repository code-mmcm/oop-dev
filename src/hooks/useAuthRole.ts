import { useAuth } from '../contexts/AuthContext';

export const useAuthRole = () => {
  const { userRole, userProfile, isAdmin, roleLoading, refreshUserData } = useAuth();

  const hasRole = (role: string): boolean => {
    return userRole?.role === role;
  };

  const hasAnyRole = (roles: string[]): boolean => {
    return roles.includes(userRole?.role || '');
  };

  return {
    userRole,
    userProfile,
    isAdmin,
    isLoading: roleLoading,
    error: null, // Error handling is now in AuthContext
    refreshUserData,
    hasRole,
    hasAnyRole
  };
};
