import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

type AllowedRole = 'admin' | 'agent' | 'user';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: AllowedRole[];
  redirectTo?: string;
  forbiddenRedirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  redirectTo = '/login',
  forbiddenRedirectTo = '/',
}) => {
  const { user, loading, userRole, roleLoading } = useAuth();

  const cachedRole = React.useMemo(() => {
    if (typeof window === 'undefined') {
      return null;
    }

    try {
      const stored = window.localStorage.getItem('userRole');
      if (!stored) return null;
      const parsed = JSON.parse(stored);
      return typeof parsed?.role === 'string' ? parsed.role : null;
    } catch (error) {
      console.error('Failed to read cached role from localStorage:', error);
      return null;
    }
  }, []);

  const resolvedRole = userRole?.role ?? cachedRole ?? null;

  if (loading) {
    return null;
  }

  if (!user) {
    return <Navigate to={redirectTo} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const normalizedAllowed = allowedRoles.map(role => role.toLowerCase());
    const normalizedRole = resolvedRole?.toLowerCase() ?? null;

    if (!normalizedRole) {
      if (roleLoading) {
        return null;
      }
      return <Navigate to={forbiddenRedirectTo} replace />;
    }

    if (!normalizedAllowed.includes(normalizedRole)) {
      return <Navigate to={forbiddenRedirectTo} replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
