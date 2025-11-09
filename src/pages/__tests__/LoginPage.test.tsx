import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';

import { render, screen, waitFor } from '../../test-utils';
import LoginPage from '../LoginPage';
import { useAuth } from '../../hooks/useAuth';
import type { Location } from 'react-router-dom';
import { useLocation } from 'react-router-dom';

jest.mock('../../hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

const navigateMock = jest.fn();
const navigateComponentSpy = jest.fn();

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
    useLocation: jest.fn(),
    Navigate: (props: { to: string; replace?: boolean }) => {
      navigateComponentSpy(props);
      return <div data-testid="navigate" data-to={props.to} data-replace={props.replace ?? false} />;
    },
  };
});

type UseAuthMock = jest.MockedFunction<typeof useAuth>;
const mockedUseAuth = useAuth as UseAuthMock;
const mockedUseLocation = useLocation as jest.MockedFunction<typeof useLocation>;

interface MockAuthState {
  login: jest.Mock<Promise<void>, [{ email: string; password: string }] | []>;
  logout: jest.Mock<Promise<void>, []>;
  refreshSession: jest.Mock<Promise<void>, []>;
  resetError: jest.Mock<void, []>;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: { message: string } | null;
  user: null;
  session: null;
}

const createAuthState = (overrides: Partial<MockAuthState> = {}): MockAuthState => ({
  login: jest.fn().mockResolvedValue(undefined),
  logout: jest.fn().mockResolvedValue(undefined),
  refreshSession: jest.fn().mockResolvedValue(undefined),
  resetError: jest.fn(),
  isAuthenticated: false,
  isLoading: false,
  error: null,
  user: null,
  session: null,
  ...overrides,
});

const createLocation = (overrides: Partial<Location> & { state?: unknown } = {}): Location & { state?: unknown } => ({
  pathname: '/login',
  search: '',
  hash: '',
  key: 'default',
  state: undefined,
  ...overrides,
});

describe('LoginPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    navigateMock.mockClear();
  });

  it('redirects to target route when user is already authenticated', () => {
    const authState = createAuthState({ isAuthenticated: true });
    mockedUseAuth.mockReturnValue(authState as unknown as ReturnType<typeof useAuth>);

    mockedUseLocation.mockReturnValue(
      createLocation({ state: { from: { pathname: '/turmas' } } }) as ReturnType<typeof useLocation>,
    );

    render(<LoginPage />);

    expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/turmas');
    expect(navigateComponentSpy).toHaveBeenCalledWith(
      expect.objectContaining({ to: '/turmas', replace: true }),
    );
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it('renders the form and validates email and password inputs', async () => {
    const authState = createAuthState();
    mockedUseAuth.mockReturnValue(authState as unknown as ReturnType<typeof useAuth>);
    mockedUseLocation.mockReturnValue(createLocation() as ReturnType<typeof useLocation>);

    const user = userEvent.setup();

    render(<LoginPage />);

    const emailInput = screen.getByLabelText('E-mail');
    const passwordInput = screen.getByLabelText('Senha');
    const submitButton = screen.getByRole('button', { name: 'Entrar' });

    expect(submitButton).toBeDisabled();

    await user.type(emailInput, 'professora');
    expect(screen.getByText('Informe um e-mail válido.')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();

    await user.type(passwordInput, '123');
    expect(screen.getByText('A senha deve conter pelo menos 6 caracteres.')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();

    await user.clear(emailInput);
    await user.type(emailInput, 'professora@portal.com');
    await user.clear(passwordInput);
    await user.type(passwordInput, 'senha123');

    expect(screen.queryByText('Informe um e-mail válido.')).not.toBeInTheDocument();
    expect(screen.queryByText('A senha deve conter pelo menos 6 caracteres.')).not.toBeInTheDocument();
    expect(submitButton).toBeEnabled();
  });

  it('submits credentials and navigates to redirect path', async () => {
    const loginMock = jest.fn().mockResolvedValue(undefined);
    const authState = createAuthState({ login: loginMock });
    mockedUseAuth.mockReturnValue(authState as unknown as ReturnType<typeof useAuth>);

    mockedUseLocation.mockReturnValue(
      createLocation({ state: { from: { pathname: '/avaliacoes' } } }) as ReturnType<typeof useLocation>,
    );

    const user = userEvent.setup();

    render(<LoginPage />);

    const emailInput = screen.getByLabelText('E-mail');
    const passwordInput = screen.getByLabelText('Senha');
    const submitButton = screen.getByRole('button', { name: 'Entrar' });

    await user.type(emailInput, 'professora@portal.com');
    await user.type(passwordInput, 'senha123');

    await user.click(submitButton);

    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledWith({ email: 'professora@portal.com', password: 'senha123' });
    });

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/avaliacoes', { replace: true });
    });

    await waitFor(() => expect(emailInput).toHaveValue(''));
    expect(passwordInput).toHaveValue('');
  });

  it('shows error feedback, resets it on input change, and keeps the button enabled after a failed attempt', async () => {
    const loginMock = jest.fn().mockRejectedValue(new Error('Credenciais inválidas'));
    const resetErrorMock = jest.fn();
    const authState = createAuthState({
      login: loginMock,
      resetError: resetErrorMock,
      error: { message: 'Credenciais inválidas.' },
    });
    mockedUseAuth.mockReturnValue(authState as unknown as ReturnType<typeof useAuth>);
    mockedUseLocation.mockReturnValue(createLocation() as ReturnType<typeof useLocation>);

    const user = userEvent.setup();

    render(<LoginPage />);

    const emailInput = screen.getByLabelText('E-mail');
    const passwordInput = screen.getByLabelText('Senha');
    const submitButton = screen.getByRole('button', { name: 'Entrar' });

    expect(screen.getByText('Credenciais inválidas.')).toBeInTheDocument();

    await user.type(emailInput, 'professora@portal.com');
    await user.type(passwordInput, 'senha123');

    await user.click(submitButton);

    await waitFor(() => expect(loginMock).toHaveBeenCalled());
    expect(submitButton).toBeEnabled();

    await user.type(emailInput, '{backspace}');
    expect(resetErrorMock).toHaveBeenCalled();
  });
});
