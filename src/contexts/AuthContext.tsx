import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';

import type { AuthCredentials, AuthSession, User } from '../types';
import { AuthServiceError, authService } from '../services/authService';

interface AuthContextValue {
  user: User | null;
  session: AuthSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: AuthServiceError | null;
  login: (credentials: AuthCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  resetError: () => void;
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

type AuthStatus = 'idle' | 'initializing' | 'authenticated' | 'unauthenticated';

export const AuthProvider = ({ children }: AuthProviderProps): ReactElement => {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [status, setStatus] = useState<AuthStatus>('initializing');
  const [error, setError] = useState<AuthServiceError | null>(null);
  const pendingOperation = useRef<Promise<void> | null>(null);

  useEffect(() => {
    let isActive = true;

    const restore = async (): Promise<void> => {
      setStatus('initializing');
      try {
        const restored = await authService.restoreSession();
        if (!isActive) {
          return;
        }

        if (restored) {
          setSession(restored);
          setStatus('authenticated');
        } else {
          setSession(null);
          setStatus('unauthenticated');
        }
      } catch (restoreError) {
        if (!isActive) {
          return;
        }

        if (restoreError instanceof AuthServiceError) {
          setError(restoreError);
        }
        setSession(null);
        setStatus('unauthenticated');
      }
    };

    restore();

    return () => {
      isActive = false;
      pendingOperation.current = null;
    };
  }, []);

  const runExclusive = useCallback(async (task: () => Promise<void>): Promise<void> => {
    if (pendingOperation.current) {
      await pendingOperation.current;
    }
    const operation = task();
    pendingOperation.current = operation;
    try {
      await operation;
    } finally {
      if (pendingOperation.current === operation) {
        pendingOperation.current = null;
      }
    }
  }, []);

  const login = useCallback(
    async (credentials: AuthCredentials): Promise<void> => {
      await runExclusive(async () => {
        setStatus('initializing');
        setError(null);
        try {
          const nextSession = await authService.login(credentials);
          setSession(nextSession);
          setStatus('authenticated');
        } catch (loginError) {
          if (loginError instanceof AuthServiceError) {
            setError(loginError);
            setStatus('unauthenticated');
            throw loginError;
          }

          const fallback = new AuthServiceError('unknown', 'Erro inesperado ao autenticar.');
          setError(fallback);
          setStatus('unauthenticated');
          throw fallback;
        }
      });
    },
    [runExclusive],
  );

  const logout = useCallback(async (): Promise<void> => {
    await runExclusive(async () => {
      setStatus('initializing');
      setError(null);
      try {
        await authService.logout();
      } finally {
        setSession(null);
        setStatus('unauthenticated');
      }
    });
  }, [runExclusive]);

  const refreshSession = useCallback(async (): Promise<void> => {
    await runExclusive(async () => {
      if (!session?.tokens.refreshToken) {
        await logout();
        return;
      }

      try {
        const refreshed = await authService.refreshSession(session.tokens.refreshToken);
        setSession(refreshed);
        setStatus('authenticated');
        setError(null);
      } catch (refreshError) {
        if (refreshError instanceof AuthServiceError) {
          setError(refreshError);
        }
        await logout();
      }
    });
  }, [logout, runExclusive, session?.tokens.refreshToken]);

  const resetError = useCallback(() => setError(null), []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      session,
      isAuthenticated: status === 'authenticated',
      isLoading: status === 'initializing',
      error,
      login,
      logout,
      refreshSession,
      resetError,
    }),
    [error, login, logout, refreshSession, resetError, session, status],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
