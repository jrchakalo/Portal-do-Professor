import type { ReactElement } from 'react';

import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth';

interface PrivateRouteProps {
  redirectTo?: string;
  fallback?: ReactElement;
}

export const PrivateRoute = ({
  redirectTo = '/login',
  fallback = <div>Carregando...</div>,
}: PrivateRouteProps): ReactElement => {
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return fallback;
  }

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  return <Outlet />;
};
