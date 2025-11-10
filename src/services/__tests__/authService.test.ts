import '@testing-library/jest-dom';

import { authService, AuthServiceError } from '../authService';
import type { AuthCredentials, AuthSession, User } from '../../types';
import { mockServer } from '../mockServer';
import { clearPersistedSession, persistAuthSession, readPersistedSession } from '../httpClient';

jest.mock('../mockServer', () => ({
  mockServer: {
    login: jest.fn(),
    logout: jest.fn(),
    refreshSession: jest.fn(),
    verifyAccessToken: jest.fn(),
  },
}));

jest.mock('../httpClient', () => ({
  persistAuthSession: jest.fn(),
  readPersistedSession: jest.fn(),
  clearPersistedSession: jest.fn(),
}));

type MockServer = jest.Mocked<typeof mockServer>;
const mockedMockServer = mockServer as MockServer;
const mockedPersistSession = persistAuthSession as jest.MockedFunction<typeof persistAuthSession>;
const mockedReadPersistedSession = readPersistedSession as jest.MockedFunction<typeof readPersistedSession>;
const mockedClearPersistedSession = clearPersistedSession as jest.MockedFunction<typeof clearPersistedSession>;

const teacherUser: User = {
  id: 'user-1',
  name: 'Professora Maria',
  email: 'professora@portal.com',
  role: 'teacher',
};

const createSession = (overrides: Partial<AuthSession> = {}): AuthSession => ({
  user: teacherUser,
  tokens: {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
  },
  issuedAt: '2025-05-01T10:00:00.000Z',
  ...overrides,
});

const credentials: AuthCredentials = {
  email: 'professora@portal.com',
  password: 'senha123',
};

describe('authService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('authenticates the user, persists the session, and returns it on login', async () => {
    const session = createSession();
    mockedMockServer.login.mockResolvedValue(session);

    const result = await authService.login(credentials);

    expect(mockedMockServer.login).toHaveBeenCalledWith(credentials);
    expect(mockedPersistSession).toHaveBeenCalledWith(session);
    expect(result).toEqual(session);
  });

  it('maps mock server errors to AuthServiceError on login failures', async () => {
    mockedMockServer.login.mockRejectedValue(new Error('INVALID_CREDENTIALS'));

    await expect(authService.login(credentials)).rejects.toEqual(
      expect.objectContaining({ code: 'invalid-credentials', message: 'Credenciais inválidas.' }),
    );
  });

  it('clears persisted data and notifies the mock server on logout', async () => {
    mockedReadPersistedSession.mockReturnValue({ accessToken: 'access-token', refreshToken: 'refresh-token' });
    mockedMockServer.logout.mockResolvedValue(undefined);

    await authService.logout();

    expect(mockedReadPersistedSession).toHaveBeenCalled();
    expect(mockedClearPersistedSession).toHaveBeenCalled();
    expect(mockedMockServer.logout).toHaveBeenCalledWith('access-token');
  });

  it('returns silently when there is no stored session on logout', async () => {
    mockedReadPersistedSession.mockReturnValue(null);

    await expect(authService.logout()).resolves.toBeUndefined();

    expect(mockedMockServer.logout).not.toHaveBeenCalled();
    expect(mockedClearPersistedSession).toHaveBeenCalled();
  });

  it('refreshes the session using the provided token and persists it', async () => {
    const refreshedSession = createSession({ tokens: { accessToken: 'new-access', refreshToken: 'new-refresh' } });
    mockedMockServer.refreshSession.mockResolvedValue(refreshedSession);

    const result = await authService.refreshSession('refresh-token');

    expect(mockedMockServer.refreshSession).toHaveBeenCalledWith('refresh-token');
    expect(mockedPersistSession).toHaveBeenCalledWith(refreshedSession);
    expect(result).toEqual(refreshedSession);
  });

  it('reads refresh token from storage and rejects when it is missing', async () => {
    mockedReadPersistedSession.mockReturnValue(null);

    await expect(authService.refreshSession()).rejects.toEqual(
      expect.objectContaining({ code: 'invalid-token', message: 'Refresh token ausente.' }),
    );

    expect(mockedClearPersistedSession).toHaveBeenCalled();
  });

  it('clears persisted data when refresh fails on the server', async () => {
    const error = new AuthServiceError('invalid-token', 'Token inválido.');
    mockedMockServer.refreshSession.mockRejectedValue(error);

    await expect(authService.refreshSession('refresh-token')).rejects.toBe(error);

    expect(mockedClearPersistedSession).toHaveBeenCalled();
  });

  it('restores session from persisted tokens when the access token is still valid', async () => {
    mockedReadPersistedSession.mockReturnValue({ accessToken: 'valid-access', refreshToken: 'valid-refresh' });
    mockedMockServer.verifyAccessToken.mockReturnValue(teacherUser);

    const restored = await authService.restoreSession();

    expect(mockedMockServer.verifyAccessToken).toHaveBeenCalledWith('valid-access');
    expect(restored?.user).toEqual(teacherUser);
    expect(mockedPersistSession).toHaveBeenCalledWith(expect.objectContaining({ tokens: { accessToken: 'valid-access', refreshToken: 'valid-refresh' } }));
  });

  it('attempts to refresh the session when the access token is invalid and returns the refreshed session', async () => {
    mockedReadPersistedSession.mockReturnValue({ accessToken: 'stale-access', refreshToken: 'refresh-token' });
    mockedMockServer.verifyAccessToken.mockReturnValue(null);
    const refreshedSession = createSession({ tokens: { accessToken: 'next-access', refreshToken: 'next-refresh' } });
    mockedMockServer.refreshSession.mockResolvedValue(refreshedSession);

    const restored = await authService.restoreSession();

    expect(mockedMockServer.refreshSession).toHaveBeenCalledWith('refresh-token');
    expect(restored).toEqual(refreshedSession);
    expect(mockedPersistSession).toHaveBeenCalledWith(refreshedSession);
  });

  it('returns null when refresh during restoration fails due to invalid token', async () => {
    mockedReadPersistedSession.mockReturnValue({ accessToken: 'expired-access', refreshToken: 'invalid-refresh' });
    mockedMockServer.verifyAccessToken.mockReturnValue(null);
    const error = new AuthServiceError('invalid-token', 'Sessão inválida.');
    mockedMockServer.refreshSession.mockRejectedValue(error);

    const restored = await authService.restoreSession();

    expect(restored).toBeNull();
    expect(mockedClearPersistedSession).toHaveBeenCalled();
  });
});
