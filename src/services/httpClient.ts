import axios, { AxiosError } from 'axios';

import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

import type { AuthSession } from '../types';
import { enableMockAdapter } from './mockAdapter';

const MOCK_API_BASE_URL = '/api';

const TOKEN_STORAGE_KEY = 'portal-professor.tokens';

interface StoredTokens {
  accessToken: string;
  refreshToken?: string;
}

const readTokens = (): StoredTokens | null => {
  try {
    const raw = window.localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as StoredTokens;
  } catch (error) {
    console.warn('Failed to read tokens from storage', error);
    return null;
  }
};

const persistTokens = (tokens: StoredTokens | null): void => {
  try {
    if (!tokens) {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokens));
  } catch (error) {
    console.warn('Failed to persist tokens to storage', error);
  }
};

export const clearPersistedSession = (): void => {
  persistTokens(null);
};

export const readPersistedSession = (): StoredTokens | null => readTokens();

export const persistAuthSession = (session: AuthSession): void => {
  persistTokens({
    accessToken: session.tokens.accessToken,
    refreshToken: session.tokens.refreshToken,
  });
};

const createHttpClient = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: MOCK_API_BASE_URL,
    timeout: 10_000,
  });

  enableMockAdapter(instance);

  instance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const tokens = readTokens();
    if (tokens?.accessToken) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${tokens.accessToken}`;
    }
    return config;
  });

  instance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      if (!error.response || error.response.status !== 401) {
        return Promise.reject(error);
      }

      const tokens = readTokens();
      if (!tokens?.refreshToken) {
        clearPersistedSession();
        return Promise.reject(error);
      }

      try {
        const refreshResponse = await instance.post<AuthSession>(
          '/auth/refresh',
          {
            refreshToken: tokens.refreshToken,
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
