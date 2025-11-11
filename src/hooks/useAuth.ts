import { useCallback, useContext, useMemo } from 'react';

import { AuthContext } from '../contexts/AuthContext';
import type { AuthCredentials } from '../types';

// Hook responsável por expor o contexto de autenticação com nomenclatura coerente para os componentes
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }

  const { login, logout, refreshSession, resetError, ...rest } = context;

  // Padroniza nomenclatura e evita recriação desnecessária das funções vindas do contexto
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
