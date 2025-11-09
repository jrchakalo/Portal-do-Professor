import { AxiosError } from 'axios';

import type {
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';

import type {
  AuthCredentials,
  AuthSession,
  ClassRoom,
  CreateClassInput,
  UpdateClassInput,
} from '../types';
import type { CreateStudentInput, Student, UpdateStudentInput } from '../types/student';
import { mockServer } from './mockServer';

type RouteHandler = (
  config: InternalAxiosRequestConfig,
  params: Record<string, string>,
) => Promise<AxiosResponse>;

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

interface RegisteredRoute {
  method: string;
  matcher: RegExp;
  paramNames: string[];
  handler: RouteHandler;
  requiresAuth: boolean;
}

const routes: RegisteredRoute[] = [];

const pathToRegex = (path: string): { matcher: RegExp; paramNames: string[] } => {
  const segments = path.split('/').filter(Boolean);
  const paramNames: string[] = [];
  const pattern = segments
    .map((segment) => {
      if (segment.startsWith(':')) {
        paramNames.push(segment.slice(1));
        return '([^/]+)';
      }
      return segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    })
    .join('/');

  const matcher = new RegExp(`^/${pattern}$`);
  return { matcher, paramNames };
};

const registerRoute = (
  method: string,
  path: string,
  handler: RouteHandler,
  requiresAuth = false,
): void => {
  const { matcher, paramNames } = pathToRegex(path);
  routes.push({
    method: method.toLowerCase(),
    matcher,
    paramNames,
    handler,
    requiresAuth,
  });
};

const normalizePath = (config: InternalAxiosRequestConfig): { method: string; path: string } => {
  const method = (config.method ?? 'get').toLowerCase();
  const baseURL = config.baseURL ?? '';
  const url = config.url ?? '';
  const path = url.startsWith(baseURL) ? url.slice(baseURL.length) : url;
  return {
    method,
    path: path.startsWith('/') ? path : `/${path}`,
  };
};

const matchRoute = (
  config: InternalAxiosRequestConfig,
): { route: RegisteredRoute; params: Record<string, string> } | undefined => {
  const { method, path } = normalizePath(config);

  for (const route of routes) {
    if (route.method !== method) {
      continue;
    }

    const match = route.matcher.exec(path);
    if (!match) {
      continue;
    }

    const params: Record<string, string> = {};
    route.paramNames.forEach((name, index) => {
      params[name] = match[index + 1];
    });

    return { route, params };
  }

  return undefined;
};

const ensureAuthenticated = (config: InternalAxiosRequestConfig): void => {
  const token = extractBearerToken(config);
  if (!token) {
    throw createError(config, 401, { message: 'Token não informado.' });
  }

  const user = mockServer.verifyAccessToken(token);
  if (!user) {
    throw createError(config, 401, { message: 'Sessão inválida.' });
  }
};

const registerAuthRoutes = (): void => {
  registerRoute('post', '/auth/login', async (config) => {
    const payload = parseJsonData<AuthCredentials>(config);
    const session = await mockServer.login(payload);
    return createResponse<AuthSession>(config, session, 200);
  });

  registerRoute('post', '/auth/logout', async (config) => {
    const token = extractBearerToken(config);
    if (token) {
      await mockServer.logout(token);
    }
    return createResponse(config, undefined, 204);
  });

  registerRoute('post', '/auth/refresh', async (config) => {
    const payload = parseJsonData<{ refreshToken?: string }>(config);
    if (!payload.refreshToken) {
      throw createError(config, 400, { message: 'Refresh token é obrigatório.' });
    }

    const session = await mockServer.refreshSession(payload.refreshToken);
    return createResponse<AuthSession>(config, session, 200);
  });

  registerRoute('get', '/auth/session', async (config) => {
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
  });
};

const registerStudentRoutes = (): void => {
  const validateStudentPayload = (
    config: InternalAxiosRequestConfig,
    payload: Partial<CreateStudentInput>,
  ): CreateStudentInput => {
    const name = payload.name?.trim();
    const email = payload.email?.trim();
    const status = payload.status;

    if (!name) {
      throw createError(config, 400, { message: 'Nome é obrigatório.' });
    }

    if (!email) {
      throw createError(config, 400, { message: 'E-mail é obrigatório.' });
    }

    if (status !== 'active' && status !== 'inactive') {
      throw createError(config, 400, { message: 'Status inválido.' });
    }

    return {
      name,
      email,
      status,
      classId: payload.classId ?? null,
    } satisfies CreateStudentInput;
  };

  registerRoute(
    'get',
    '/students',
    async (config) => {
      const students = await mockServer.listStudents();
      return createResponse<Student[]>(config, students, 200);
    },
    true,
  );

  registerRoute(
    'post',
    '/students',
    async (config) => {
      const payload = validateStudentPayload(config, parseJsonData(config));
      const student = await mockServer.createStudent(payload);
      return createResponse<Student>(config, student, 201);
    },
    true,
  );

  registerRoute(
    'put',
    '/students/:id',
    async (config, params) => {
      const payload = parseJsonData<UpdateStudentInput>(config);
      const student = await mockServer.updateStudent(params.id, payload);
      return createResponse<Student>(config, student, 200);
    },
    true,
  );

  registerRoute(
    'delete',
    '/students/:id',
    async (config, params) => {
      await mockServer.deleteStudent(params.id);
      return createResponse(config, undefined, 204);
    },
    true,
  );
};

const registerClassRoutes = (): void => {
  const normalizeCapacity = (config: InternalAxiosRequestConfig, value: unknown): number => {
    const capacity = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(capacity) || Number.isNaN(capacity)) {
      throw createError(config, 400, { message: 'Capacidade inválida.' });
    }

    const normalized = Math.floor(capacity);
    if (normalized < 1) {
      throw createError(config, 400, { message: 'Capacidade deve ser pelo menos 1.' });
    }

    return normalized;
  };

  const validateClassPayload = (
    config: InternalAxiosRequestConfig,
    payload: Partial<CreateClassInput>,
  ): CreateClassInput => {
    const name = payload.name?.trim();
    if (!name) {
      throw createError(config, 400, { message: 'Nome da turma é obrigatório.' });
    }

    const capacity = normalizeCapacity(config, payload.capacity);

    return {
      name,
      capacity,
    } satisfies CreateClassInput;
  };

  registerRoute(
    'get',
    '/classes',
    async (config) => {
      const classes = await mockServer.listClasses();
      return createResponse<ClassRoom[]>(config, classes, 200);
    },
    true,
  );

  registerRoute(
    'post',
    '/classes',
    async (config) => {
      const payload = validateClassPayload(config, parseJsonData(config));
      const classRoom = await mockServer.createClass(payload);
      return createResponse<ClassRoom>(config, classRoom, 201);
    },
    true,
  );

  registerRoute(
    'put',
    '/classes/:id',
    async (config, params) => {
      const payload = parseJsonData<UpdateClassInput>(config);
      const updates: UpdateClassInput = {};

      if (typeof payload.name !== 'undefined') {
        const name = payload.name.trim();
        if (!name) {
          throw createError(config, 400, { message: 'Nome da turma não pode ser vazio.' });
        }
        updates.name = name;
      }

      if (typeof payload.capacity !== 'undefined') {
        updates.capacity = normalizeCapacity(config, payload.capacity);
      }

      const classRoom = await mockServer.updateClass(params.id, updates);
      return createResponse<ClassRoom>(config, classRoom, 200);
    },
    true,
  );

  registerRoute(
    'delete',
    '/classes/:id',
    async (config, params) => {
      await mockServer.deleteClass(params.id);
      return createResponse(config, undefined, 204);
    },
    true,
  );
};

const ensureRoutesRegistered = (() => {
  let initialized = false;

  return () => {
    if (initialized) {
      return;
    }
    registerAuthRoutes();
    registerStudentRoutes();
    registerClassRoutes();
    initialized = true;
  };
})();

export const enableMockAdapter = (client: AxiosInstance): void => {
  client.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
    ensureRoutesRegistered();

    const match = matchRoute(config);

    if (!match) {
      throw createError(config, 404, { message: `Endpoint mock não encontrado: ${config.url}` });
    }

    try {
      if (match.route.requiresAuth) {
        ensureAuthenticated(config);
      }

      const response = await match.route.handler(config, match.params);
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
