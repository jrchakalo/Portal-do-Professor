import '@testing-library/jest-dom';

import { render, screen } from '../../test-utils';
import DashboardPage from '../DashboardPage';
import { useDashboardOverview } from '../../hooks/useDashboardOverview';
import { formatScheduledDate } from '../../utils/date';

const upcomingEvaluationsCardSpy = jest.fn((props: { evaluations: unknown; isLoading: boolean }) => props);
const classCapacityCardSpy = jest.fn((props: { classes: unknown; isLoading: boolean }) => props);
const pendingEvaluationsCardSpy = jest.fn((props: { pendingClasses: unknown; isLoading: boolean }) => props);
const evaluationConfigCardSpy = jest.fn((props: { configs: unknown; isLoading: boolean }) => props);
const studentStatusCardSpy = jest.fn((props: { status: unknown; isLoading: boolean }) => props);
const capacityAlertsCardSpy = jest.fn((props: { alerts: unknown; isLoading: boolean }) => props);

jest.mock('../../hooks/useDashboardOverview', () => ({
  useDashboardOverview: jest.fn(),
}));

jest.mock('../../components/dashboard/UpcomingEvaluationsCard', () => ({
  UpcomingEvaluationsCard: (props: { evaluations: unknown; isLoading: boolean }) => {
    upcomingEvaluationsCardSpy(props);
    return <div data-testid="upcoming-evaluations-card" data-loading={props.isLoading} />;
  },
}));

jest.mock('../../components/dashboard/ClassCapacityCard', () => ({
  ClassCapacityCard: (props: { classes: unknown; isLoading: boolean }) => {
    classCapacityCardSpy(props);
    return <div data-testid="class-capacity-card" data-loading={props.isLoading} />;
  },
}));

jest.mock('../../components/dashboard/PendingEvaluationsCard', () => ({
  PendingEvaluationsCard: (props: { pendingClasses: unknown; isLoading: boolean }) => {
    pendingEvaluationsCardSpy(props);
    return <div data-testid="pending-evaluations-card" data-loading={props.isLoading} />;
  },
}));

jest.mock('../../components/dashboard/EvaluationConfigCard', () => ({
  EvaluationConfigCard: (props: { configs: unknown; isLoading: boolean }) => {
    evaluationConfigCardSpy(props);
    return <div data-testid="evaluation-config-card" data-loading={props.isLoading} />;
  },
}));

jest.mock('../../components/dashboard/StudentStatusCard', () => ({
  StudentStatusCard: (props: { status: unknown; isLoading: boolean }) => {
    studentStatusCardSpy(props);
    return <div data-testid="student-status-card" data-loading={props.isLoading} />;
  },
}));

jest.mock('../../components/dashboard/CapacityAlertsCard', () => ({
  CapacityAlertsCard: (props: { alerts: unknown; isLoading: boolean }) => {
    capacityAlertsCardSpy(props);
    return <div data-testid="capacity-alerts-card" data-loading={props.isLoading} />;
  },
}));

jest.mock('../../utils/date', () => ({
  formatScheduledDate: jest.fn(),
}));

type UseDashboardOverviewMock = jest.MockedFunction<typeof useDashboardOverview>;
const mockedUseDashboardOverview = useDashboardOverview as UseDashboardOverviewMock;
const mockedFormatScheduledDate = formatScheduledDate as jest.MockedFunction<typeof formatScheduledDate>;

const createDashboardState = (overrides: Partial<ReturnType<UseDashboardOverviewMock>> = {}) => {
  const evaluations = [
    {
      id: 'evaluation-1',
      title: 'Avaliação de Matemática',
      classId: 'class-1',
      className: 'Turma Alfa',
      scheduledAt: new Date('2025-05-20T13:00:00.000Z'),
    },
    {
      id: 'evaluation-2',
      title: 'Avaliação de História',
      classId: 'class-2',
      className: 'Turma Beta',
      scheduledAt: new Date('2025-05-18T12:00:00.000Z'),
    },
  ];

  const state = {
    metrics: {
      students: 120,
      classes: 8,
      activeStudents: 95,
    },
    evaluations,
    classSummaries: [
      {
        id: 'class-1',
        name: 'Turma Alfa',
        capacity: 30,
        totalStudents: 26,
        activeCount: 24,
        inactiveCount: 2,
        occupancyPercent: 87,
      },
    ],
    nextEvaluation: evaluations[1],
    pendingEvaluations: [
      {
        id: 'class-3',
        name: 'Turma Gama',
        studentCount: 12,
        lastUpdatedAt: new Date('2025-04-15T12:00:00.000Z'),
      },
    ],
    evaluationConfigs: [
      {
        id: 'class-1',
        className: 'Turma Alfa',
        criteriaCount: 3,
        totalWeight: 100,
        isWeightBalanced: true,
        updatedAt: new Date('2025-04-10T10:00:00.000Z'),
      },
    ],
    studentStatus: {
      active: 95,
      inactive: 25,
      total: 120,
    },
    capacityAlerts: [
      {
        id: 'class-1',
        name: 'Turma Alfa',
        occupancyPercent: 87,
        capacity: 30,
        totalStudents: 26,
      },
    ],
    isLoading: false,
  } as ReturnType<UseDashboardOverviewMock>;

  return {
    ...state,
    ...overrides,
  };
};

describe('DashboardPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders overview metrics and forwards data to dashboard cards', () => {
    mockedFormatScheduledDate.mockReturnValue('20/05 10:00');
    const overviewState = createDashboardState();
    mockedUseDashboardOverview.mockReturnValue(overviewState);

    render(<DashboardPage />);

    expect(screen.getByText('Visão Geral')).toBeInTheDocument();
    expect(screen.getByText('Alunos ativos')).toBeInTheDocument();
    expect(screen.getByText('95')).toBeInTheDocument();
    expect(screen.getByText('Total de 120 alunos cadastrados')).toBeInTheDocument();
    expect(screen.getByText('Turmas')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('Próxima avaliação')).toBeInTheDocument();
    expect(screen.getByText('Avaliação de História')).toBeInTheDocument();
    expect(screen.getByText('Turma Beta · 20/05 10:00')).toBeInTheDocument();

    expect(upcomingEvaluationsCardSpy).toHaveBeenCalledWith(
      expect.objectContaining({ evaluations: overviewState.evaluations, isLoading: false }),
    );
    expect(classCapacityCardSpy).toHaveBeenCalledWith(
      expect.objectContaining({ classes: overviewState.classSummaries, isLoading: false }),
    );
    expect(pendingEvaluationsCardSpy).toHaveBeenCalledWith(
      expect.objectContaining({ pendingClasses: overviewState.pendingEvaluations, isLoading: false }),
    );
    expect(evaluationConfigCardSpy).toHaveBeenCalledWith(
      expect.objectContaining({ configs: overviewState.evaluationConfigs, isLoading: false }),
    );
    expect(studentStatusCardSpy).toHaveBeenCalledWith(
      expect.objectContaining({ status: overviewState.studentStatus, isLoading: false }),
    );
    expect(capacityAlertsCardSpy).toHaveBeenCalledWith(
      expect.objectContaining({ alerts: overviewState.capacityAlerts, isLoading: false }),
    );
  });

  it('shows fallback text when there is no upcoming evaluation scheduled', () => {
    mockedFormatScheduledDate.mockReturnValue('unused');
    const overviewState = createDashboardState({ evaluations: [], nextEvaluation: null, pendingEvaluations: [] });
    mockedUseDashboardOverview.mockReturnValue(overviewState);

    render(<DashboardPage />);

    expect(screen.getByText('Nenhuma avaliação agendada')).toBeInTheDocument();
    expect(screen.queryByText(/·/)).not.toBeInTheDocument();
    expect(mockedFormatScheduledDate).not.toHaveBeenCalled();

    expect(upcomingEvaluationsCardSpy).toHaveBeenCalledWith(
      expect.objectContaining({ evaluations: overviewState.evaluations, isLoading: false }),
    );
  });
});
