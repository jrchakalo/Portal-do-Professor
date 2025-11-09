import { useCallback, useContext, useMemo } from 'react';

import { AuthContext } from '../contexts/AuthContext';
import type { AuthCredentials } from '../types';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }

  const { login, logout, refreshSession, resetError, ...rest } = context;

  const authenticate = useCallback(
    (credentials: AuthCredentials) => login(credentials),
    [login],
  );

  const signOut = useCallback(() => logout(), [logout]);

  const refresh = useCallback(() => refreshSession(), [refreshSession]);

  const value = useMemo(
    () => ({
      ...rest,
      login: authenticate,
      logout: signOut,
      refreshSession: refresh,
      resetError,
    }),
    [authenticate, refresh, resetError, rest, signOut],
  );

  return value;
};
