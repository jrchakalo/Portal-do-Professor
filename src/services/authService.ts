import type { AuthCredentials, AuthSession } from '../types';
import { mockServer } from './mockServer';
import {
  clearPersistedSession,
  persistAuthSession,
  readPersistedSession,
} from './httpClient';

export type AuthErrorCode = 'invalid-credentials' | 'invalid-token' | 'unknown';

export class AuthServiceError extends Error {
  code: AuthErrorCode;

  constructor(code: AuthErrorCode, message?: string) {
    super(message ?? code);
    this.code = code;
    this.name = 'AuthServiceError';
  }
}

// Garante que toda resposta de autenticação reflita imediatamente no storage local
const ensureSessionPersistence = (session: AuthSession): AuthSession => {
  persistAuthSession(session);
  return session;
};

const mapMockErrorToAuthError = (error: unknown): AuthServiceError => {
  if (error instanceof AuthServiceError) {
    return error;
  }

  if (error instanceof Error) {
    switch (error.message) {
      case 'INVALID_CREDENTIALS':
        return new AuthServiceError('invalid-credentials', 'Credenciais inválidas.');
      case 'INVALID_TOKEN':
      case 'USER_NOT_FOUND':
        return new AuthServiceError('invalid-token', 'Sessão expirada ou inválida.');
      default:
        return new AuthServiceError('unknown', error.message);
    }
  }

  return new AuthServiceError('unknown', 'Erro desconhecido na autenticação.');
};

// Força um refresh utilizando o token atual e trata expiradas inesperadas
const refreshWithToken = async (refreshToken: string): Promise<AuthSession> => {
  try {
    const session = await mockServer.refreshSession(refreshToken);
    return ensureSessionPersistence(session);
  } catch (error) {
    clearPersistedSession();
    throw mapMockErrorToAuthError(error);
  }
};

export const authService = {
  async login(credentials: AuthCredentials): Promise<AuthSession> {
    try {
      const session = await mockServer.login(credentials);
      return ensureSessionPersistence(session);
    } catch (error) {
      throw mapMockErrorToAuthError(error);
    }
  },

  async logout(): Promise<void> {
    const stored = readPersistedSession();
    clearPersistedSession();

    if (!stored?.accessToken) {
      return;
    }

    try {
      await mockServer.logout(stored.accessToken);
    } catch (error) {
      console.warn('Failed to invalidate session on mock server', error);
    }
  },

  async refreshSession(refreshToken?: string): Promise<AuthSession> {
    const token = refreshToken ?? readPersistedSession()?.refreshToken;
    if (!token) {
      clearPersistedSession();
      throw new AuthServiceError('invalid-token', 'Refresh token ausente.');
    }

    return refreshWithToken(token);
  },

  // Restaura a sessão local sincronizando com o mock server sempre que possível
  async restoreSession(): Promise<AuthSession | null> {
    const stored = readPersistedSession();
    if (!stored?.accessToken) {
      return null;
    }

    if (stored.user) {
      mockServer.rehydrateSession({
        accessToken: stored.accessToken,
        refreshToken: stored.refreshToken,
        userId: stored.user.id,
      });
    }

    const user = mockServer.verifyAccessToken(stored.accessToken);
    if (user) {
      const session: AuthSession = {
        user,
        tokens: {
          accessToken: stored.accessToken,
          refreshToken: stored.refreshToken,
        },
        issuedAt: new Date().toISOString(),
      };

      persistAuthSession(session);
      return session;
    }

    if (stored.refreshToken) {
      try {
        return await refreshWithToken(stored.refreshToken);
      } catch (error) {
        if (error instanceof AuthServiceError && error.code === 'invalid-token') {
          if (stored.user) {
            const fallbackSession: AuthSession = {
              user: stored.user,
              tokens: {
                accessToken: stored.accessToken,
                refreshToken: stored.refreshToken,
              },
              issuedAt: new Date().toISOString(),
            };

            mockServer.rehydrateSession({
              accessToken: fallbackSession.tokens.accessToken,
              refreshToken: fallbackSession.tokens.refreshToken,
              userId: fallbackSession.user.id,
            });

            persistAuthSession(fallbackSession);
            return fallbackSession;
          }

          return null;
        }
        throw error;
      }
    }

    clearPersistedSession();
    return null;
  },
};
