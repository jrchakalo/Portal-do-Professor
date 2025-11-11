import axios, { AxiosError } from 'axios';

import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

import type { AuthSession, User } from '../types';
import { enableMockAdapter } from './mockAdapter';

const MOCK_API_BASE_URL = '/api';

const SESSION_STORAGE_KEY = 'portal-professor.session';

interface StoredSession {
  accessToken: string;
  refreshToken?: string;
  user?: User;
}

const readStoredSession = (): StoredSession | null => {
  try {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as StoredSession;
  } catch (error) {
    console.warn('Failed to read tokens from storage', error);
    return null;
  }
};

const persistStoredSession = (session: StoredSession | null): void => {
  try {
    if (!session) {
      window.localStorage.removeItem(SESSION_STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch (error) {
    console.warn('Failed to persist tokens to storage', error);
  }
};

export const clearPersistedSession = (): void => {
  persistStoredSession(null);
};

export const readPersistedSession = (): StoredSession | null => readStoredSession();

export const persistAuthSession = (session: AuthSession): void => {
  persistStoredSession({
    accessToken: session.tokens.accessToken,
    refreshToken: session.tokens.refreshToken,
    user: session.user,
  });
};

const createHttpClient = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: MOCK_API_BASE_URL,
    timeout: 10_000,
  });

  enableMockAdapter(instance);

  // Anexa o access token vigente em cada requisição simulando o comportamento de produção
  instance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const stored = readStoredSession();
    if (stored?.accessToken) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${stored.accessToken}`;
    }
    return config;
  });

  instance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      if (!error.response || error.response.status !== 401) {
        return Promise.reject(error);
      }

      const stored = readStoredSession();
      if (!stored?.refreshToken) {
        clearPersistedSession();
        return Promise.reject(error);
      }

      try {
        // Tenta renovar silenciosamente a sessão e repetir a chamada original
        const refreshResponse = await instance.post<AuthSession>(
          '/auth/refresh',
          {
            refreshToken: stored.refreshToken,
          },
          {
            headers: { Authorization: undefined },
          },
        );

        persistAuthSession(refreshResponse.data);

        const originalRequest = error.config;
        if (!originalRequest) {
          return Promise.reject(error);
        }

        return instance(originalRequest);
      } catch (refreshError) {
        clearPersistedSession();
        return Promise.reject(refreshError);
      }
    },
  );

  return instance;
};

export const httpClient = createHttpClient();
