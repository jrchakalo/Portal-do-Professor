import '@testing-library/jest-dom';

import { render, screen } from '../../test-utils';
import { PrivateRoute } from '../PrivateRoute';
import { useAuth } from '../../hooks/useAuth';
import { useLocation } from 'react-router-dom';

jest.mock('../../hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

const navigateComponentSpy = jest.fn();
const outletSpy = jest.fn();

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useLocation: jest.fn(),
    Navigate: (props: { to: string; state?: unknown; replace?: boolean }) => {
      navigateComponentSpy(props);
      return (
        <div
          data-testid="navigate"
          data-to={props.to}
          data-replace={String(props.replace ?? false)}
          data-state={JSON.stringify(props.state ?? null)}
        />
      );
    },
    Outlet: () => {
      outletSpy();
      return <div data-testid="outlet" />;
    },
  };
});

type UseAuthMock = jest.MockedFunction<typeof useAuth>;
const mockedUseAuth = useAuth as UseAuthMock;
const mockedUseLocation = useLocation as jest.MockedFunction<typeof useLocation>;

describe('PrivateRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the fallback while authentication state is loading', () => {
    mockedUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
      login: jest.fn(),
      logout: jest.fn(),
      refreshSession: jest.fn(),
      resetError: jest.fn(),
      user: null,
      session: null,
      error: null,
    } as unknown as ReturnType<typeof useAuth>);

    mockedUseLocation.mockReturnValue({
      pathname: '/dashboard',
      search: '',
      hash: '',
      state: undefined,
      key: 'default',
    } as ReturnType<typeof useLocation>);

    render(<PrivateRoute fallback={<div data-testid="fallback">Carregando...</div>} />);

    expect(screen.getByTestId('fallback')).toBeInTheDocument();
    expect(screen.queryByTestId('navigate')).not.toBeInTheDocument();
    expect(screen.queryByTestId('outlet')).not.toBeInTheDocument();
  });

  it('redirects unauthenticated users to the provided route preserving location state', () => {
    const location = {
      pathname: '/turmas',
      search: '',
      hash: '',
      state: undefined,
      key: '123',
    } as ReturnType<typeof useLocation>;

    mockedUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      login: jest.fn(),
      logout: jest.fn(),
      refreshSession: jest.fn(),
      resetError: jest.fn(),
      user: null,
      session: null,
      error: null,
    } as unknown as ReturnType<typeof useAuth>);

    mockedUseLocation.mockReturnValue(location);

    render(<PrivateRoute redirectTo="/login" />);

    expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/login');
    expect(screen.getByTestId('navigate')).toHaveAttribute('data-replace', 'true');
    expect(screen.getByTestId('navigate')).toHaveAttribute('data-state', JSON.stringify({ from: location }));
    expect(navigateComponentSpy).toHaveBeenCalledWith(
      expect.objectContaining({ to: '/login', replace: true, state: { from: location } }),
    );
  });

  it('renders the protected outlet when the user is authenticated', () => {
    mockedUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      login: jest.fn(),
      logout: jest.fn(),
      refreshSession: jest.fn(),
      resetError: jest.fn(),
      user: { id: 'user-1', name: 'Alice', email: 'alice@example.com', role: 'teacher' },
      session: {
        user: { id: 'user-1', name: 'Alice', email: 'alice@example.com', role: 'teacher' },
        tokens: { accessToken: 'token', refreshToken: 'refresh' },
        issuedAt: new Date().toISOString(),
      },
      error: null,
    } as unknown as ReturnType<typeof useAuth>);

    mockedUseLocation.mockReturnValue({
      pathname: '/dashboard',
      search: '',
      hash: '',
      state: undefined,
      key: 'default',
    } as ReturnType<typeof useLocation>);

    render(<PrivateRoute />);

    expect(screen.getByTestId('outlet')).toBeInTheDocument();
    expect(outletSpy).toHaveBeenCalled();
    expect(screen.queryByTestId('navigate')).not.toBeInTheDocument();
  });
});
