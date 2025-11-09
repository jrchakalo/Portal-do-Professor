import { AxiosError } from 'axios';

import type {
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';

import type { AuthCredentials, AuthSession } from '../types';
import { mockServer } from './mockServer';

interface RouteMatch {
  method: string;
  path: string;
}

type RouteHandler = (config: InternalAxiosRequestConfig) => Promise<AxiosResponse>;

const STATUS_TEXT: Record<number, string> = {
  200: 'OK',
  201: 'Created',
  204: 'No Content',
  400: 'Bad Request',
  401: 'Unauthorized',
  404: 'Not Found',
  500: 'Internal Server Error',
};

const createResponse = <T>(
  config: InternalAxiosRequestConfig,
  data: T,
  status: number,
): AxiosResponse<T> => ({
  data,
  status,
  statusText: STATUS_TEXT[status] ?? 'OK',
  headers: {},
  config,
});

const createError = (
  config: InternalAxiosRequestConfig,
  status: number,
  data: unknown,
): never => {
  const response = createResponse(config, data, status);
  throw new AxiosError(
    typeof data === 'object' && data !== null && 'message' in data
      ? String((data as { message?: string }).message)
      : 'Mock request error',
    String(status),
    config,
    undefined,
    response,
  );
};

const parseJsonData = <T = unknown>(config: InternalAxiosRequestConfig): T => {
  const raw = config.data;
  if (!raw) {
    return {} as T;
  }

  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as T;
    } catch {
      throw createError(config, 400, { message: 'Invalid JSON payload.' });
    }
  }

  return raw as T;
};

const extractBearerToken = (config: InternalAxiosRequestConfig): string | null => {
  const authorization = config.headers?.Authorization ?? config.headers?.authorization;
  if (typeof authorization !== 'string') {
    return null;
  }

  const [scheme, token] = authorization.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return null;
  }

  return token;
};

const normalizeRoute = (config: InternalAxiosRequestConfig): RouteMatch => {
  const method = (config.method ?? 'get').toLowerCase();
  const baseURL = config.baseURL ?? '';
  const url = config.url ?? '';
  const path = url.startsWith(baseURL) ? url.slice(baseURL.length) : url;
  return {
    method,
    path: path.startsWith('/') ? path : `/${path}`,
  };
};

const authRoutes: Record<string, RouteHandler> = {
  'post /auth/login': async (config) => {
    const payload = parseJsonData<AuthCredentials>(config);
    const session = await mockServer.login(payload);
    return createResponse<AuthSession>(config, session, 200);
  },

  'post /auth/logout': async (config) => {
    const token = extractBearerToken(config);
    if (token) {
      await mockServer.logout(token);
    }
    return createResponse(config, undefined, 204);
  },

  'post /auth/refresh': async (config) => {
    const payload = parseJsonData<{ refreshToken?: string }>(config);
    if (!payload.refreshToken) {
      throw createError(config, 400, { message: 'Refresh token é obrigatório.' });
    }

    const session = await mockServer.refreshSession(payload.refreshToken);
    return createResponse<AuthSession>(config, session, 200);
  },

  'get /auth/session': async (config) => {
    const token = extractBearerToken(config);
    if (!token) {
      throw createError(config, 401, { message: 'Token não informado.' });
    }

    const user = mockServer.verifyAccessToken(token);
    if (!user) {
      throw createError(config, 401, { message: 'Sessão inválida.' });
    }

    const session: AuthSession = {
      user,
      tokens: {
        accessToken: token,
      },
      issuedAt: new Date().toISOString(),
    };

    return createResponse<AuthSession>(config, session, 200);
  },
};

const routeRegistry: Record<string, RouteHandler> = {
  ...authRoutes,
};

const findHandler = (config: InternalAxiosRequestConfig): RouteHandler | undefined => {
  const { method, path } = normalizeRoute(config);
  return routeRegistry[`${method} ${path}`];
};

export const enableMockAdapter = (client: AxiosInstance): void => {
  client.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
    const handler = findHandler(config);

    if (!handler) {
      throw createError(config, 404, { message: `Endpoint mock não encontrado: ${config.url}` });
    }

    try {
      const response = await handler(config);
      return response;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw error;
      }
      throw createError(config, 500, {
        message: error instanceof Error ? error.message : 'Erro inesperado no mock.',
      });
    }
  };
};
