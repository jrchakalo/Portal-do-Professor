import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';

import { MemoryRouter } from 'react-router-dom';
import { render, screen, within, waitFor } from '../../test-utils';
import { MainLayout } from '../MainLayout';
import { useAuth } from '../../hooks/useAuth';

type UseAuthMock = jest.MockedFunction<typeof useAuth>;
const logoutMock = jest.fn();

jest.mock('../../hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

const mockedUseAuth = useAuth as UseAuthMock;

const baseAuthState = {
  login: jest.fn(),
  logout: logoutMock,
  refreshSession: jest.fn(),
  resetError: jest.fn(),
  isAuthenticated: true,
  isLoading: false,
  error: null,
  session: {
    user: {
      id: 'teacher-1',
      name: 'Professora Maria',
      email: 'professora@portal.com',
      role: 'teacher',
    },
    tokens: { accessToken: 'access', refreshToken: 'refresh' },
    issuedAt: new Date().toISOString(),
  },
  user: {
    id: 'teacher-1',
    name: 'Professora Maria',
    email: 'professora@portal.com',
    role: 'teacher',
  },
};

const renderLayout = (initialPath = '/dashboard', props?: Parameters<typeof MainLayout>[0]) => {
  mockedUseAuth.mockReturnValue(baseAuthState as unknown as ReturnType<typeof useAuth>);

  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <MainLayout {...props}>
        {props?.children ?? <div data-testid="layout-content">Conteúdo protegido</div>}
      </MainLayout>
    </MemoryRouter>,
  );
};

describe('MainLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    logoutMock.mockReset();
  });

  it('renders the title, actions, user details, and children content', () => {
    renderLayout('/dashboard', {
      title: 'Painel Acadêmico',
      actions: <button type="button">Ação extra</button>,
      children: <div data-testid="custom-content">Conteúdo customizado</div>,
    });

    expect(screen.getByText('Painel Acadêmico')).toBeInTheDocument();
    expect(screen.getByText('Ação extra')).toBeInTheDocument();
    expect(screen.getByText('Professora Maria')).toBeInTheDocument();
    expect(screen.getByText('professora@portal.com')).toBeInTheDocument();
    expect(screen.getByTestId('custom-content')).toBeInTheDocument();
  });

  it('invokes logout when the user clicks the action button', async () => {
    const user = userEvent.setup();
    renderLayout('/dashboard');

    await user.click(screen.getByRole('button', { name: 'Encerrar sessão' }));

    expect(logoutMock).toHaveBeenCalled();
  });

  it('renders navigation links for all primary sections', async () => {
    renderLayout('/dashboard');

    await userEvent.click(screen.getByRole('button', { name: 'Abrir menu' }));

    const drawer = await screen.findByRole('dialog');
    const nav = within(drawer);

    expect(nav.getByRole('link', { name: 'Dashboard' })).toBeInTheDocument();
    expect(nav.getByRole('link', { name: 'Alunos' })).toBeInTheDocument();
    expect(nav.getByRole('link', { name: 'Turmas' })).toBeInTheDocument();
    expect(nav.getByRole('link', { name: 'Avaliações' })).toBeInTheDocument();
  });

  it('opens the mobile navigation drawer and closes it after navigating', async () => {
    const user = userEvent.setup();
    renderLayout('/alunos');

    await user.click(screen.getByRole('button', { name: 'Abrir menu' }));

    const drawer = await screen.findByRole('dialog');
    expect(drawer).toBeInTheDocument();

    const dashboardLink = within(drawer).getByRole('link', { name: 'Dashboard' });
    await user.click(dashboardLink);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
