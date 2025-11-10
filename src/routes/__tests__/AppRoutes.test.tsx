import '@testing-library/jest-dom';

import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '../../test-utils';
import { AppRoutes } from '../index';

const privateRouteSpy = jest.fn();

jest.mock('../PrivateRoute', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    PrivateRoute: (props: unknown) => {
      privateRouteSpy(props);
      return (
        <div data-testid="private-route">
          <actual.Outlet />
        </div>
      );
    },
  };
});

jest.mock('../../layouts/MainLayout', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    MainLayout: () => (
      <div data-testid="main-layout">
        <actual.Outlet />
      </div>
    ),
  };
});

jest.mock('../../pages/LoginPage', () => ({
  __esModule: true,
  default: () => <div data-testid="login-page">Login Page</div>,
}));

jest.mock('../../pages/DashboardPage', () => ({
  __esModule: true,
  default: () => <div data-testid="dashboard-page">Dashboard Page</div>,
}));

jest.mock('../../pages/StudentsPage', () => ({
  __esModule: true,
  default: () => <div data-testid="students-page">Students Page</div>,
}));

jest.mock('../../pages/ClassesPage', () => ({
  __esModule: true,
  default: () => <div data-testid="classes-page">Classes Page</div>,
}));

jest.mock('../../pages/EvaluationsPage', () => ({
  __esModule: true,
  default: () => <div data-testid="evaluations-page">Evaluations Page</div>,
}));

describe('AppRoutes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderWithRouter = (initialPath: string) => {
    return render(
      <MemoryRouter initialEntries={[initialPath]}>
        <AppRoutes />
      </MemoryRouter>,
    );
  };

  it('renders the login page when navigating to /login', () => {
    renderWithRouter('/login');

    expect(screen.getByTestId('login-page')).toBeInTheDocument();
    expect(privateRouteSpy).not.toHaveBeenCalled();
  });

  it('renders the dashboard inside the protected layout when navigating to /dashboard', () => {
    renderWithRouter('/dashboard');

    expect(screen.getByTestId('private-route')).toBeInTheDocument();
    expect(screen.getByTestId('main-layout')).toBeInTheDocument();
    expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
  });

  it('redirects the root path to /dashboard', () => {
    renderWithRouter('/');

    expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
  });

  it('redirects unknown paths to /dashboard', () => {
    renderWithRouter('/unknown-path');

    expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
  });

  it('renders the classes page when navigating to /turmas', () => {
    renderWithRouter('/turmas');

    expect(screen.getByTestId('classes-page')).toBeInTheDocument();
  });

  it('renders the students page when navigating to /alunos', () => {
    renderWithRouter('/alunos');

    expect(screen.getByTestId('students-page')).toBeInTheDocument();
  });

  it('renders the evaluations page when navigating to /avaliacoes', () => {
    renderWithRouter('/avaliacoes');

    expect(screen.getByTestId('evaluations-page')).toBeInTheDocument();
  });

  it('renders the evaluations page when navigating to a class evaluation path', () => {
    renderWithRouter('/turmas/turma-1/avaliacoes');

    expect(screen.getByTestId('evaluations-page')).toBeInTheDocument();
  });
});
