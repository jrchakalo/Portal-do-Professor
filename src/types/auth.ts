export type UserRole = 'teacher';

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface AuthSession {
  user: User;
  tokens: AuthTokens;
  issuedAt: string;
}
