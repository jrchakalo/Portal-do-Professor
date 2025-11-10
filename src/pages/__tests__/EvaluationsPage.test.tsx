import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';

import { render, screen } from '../../test-utils';
import EvaluationsPage from '../EvaluationsPage';
import { useEvaluations } from '../../hooks/useEvaluations';
import { useNavigate, useParams } from 'react-router-dom';
import type {
  ClassRoom,
  EvaluationConfig,
  EvaluationCriterionInput,
  UpcomingEvaluation,
} from '../../types';

const evaluationFormPropsSpy = jest.fn();

interface MockEvaluationFormProps {
  defaultValues?: EvaluationCriterionInput[];
  submitLabel?: string;
  cancelLabel?: string;
  onSubmit?: (criteria: EvaluationCriterionInput[]) => void | Promise<void>;
  onCancel?: () => void;
}

jest.mock('../../hooks/useEvaluations', () => ({
  useEvaluations: jest.fn(),
}));

jest.mock('../../components/evaluations/EvaluationCriteriaForm', () => ({
  EvaluationCriteriaForm: (props: MockEvaluationFormProps) => {
    evaluationFormPropsSpy(props);
    return (
      <div>
        <button type="button" onClick={() => props.onSubmit?.(props.defaultValues ?? [])}>
          {props.submitLabel ?? 'Salvar'}
        </button>
        {props.onCancel ? (
          <button type="button" onClick={() => props.onCancel?.()}>{props.cancelLabel ?? 'Cancelar'}</button>
        ) : null}
      </div>
    );
  },
}));

jest.mock('../../components/evaluations/UpcomingEvaluationsList', () => ({
  UpcomingEvaluationsList: ({ evaluations, classes }: { evaluations: UpcomingEvaluation[]; classes: ClassRoom[] }) => (
    <div data-testid="upcoming-list">upcoming:{evaluations.length}|classes:{classes.length}</div>
  ),
}));

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useNavigate: jest.fn(),
    useParams: jest.fn(),
  };
});

type UseEvaluationsState = ReturnType<typeof useEvaluations>;

const mockedUseEvaluations = useEvaluations as jest.MockedFunction<typeof useEvaluations>;
const mockedUseNavigate = useNavigate as jest.Mock;
const mockedUseParams = useParams as jest.Mock;

const createState = (overrides: Partial<UseEvaluationsState> = {}): UseEvaluationsState => ({
  classes: [],
  configs: {},
  upcomingEvaluations: [],
  isLoading: false,
  isMutating: false,
  error: null,
  refresh: jest.fn(),
  updateConfig: jest.fn(),
  resetError: jest.fn(),
  ...overrides,
});

describe('EvaluationsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    evaluationFormPropsSpy.mockClear();
    mockedUseNavigate.mockReturnValue(jest.fn());
    mockedUseParams.mockReturnValue({});
  });

  it('renders an empty state when there are no classes', () => {
    mockedUseEvaluations.mockReturnValue(createState());

    render(<EvaluationsPage />);

    expect(
      screen.getByText('Nenhuma turma cadastrada. Cadastre turmas para configurar avaliações.'),
    ).toBeInTheDocument();
  });

  it('renders class configuration when data is available and triggers refresh', async () => {
    const refreshMock = jest.fn();
    const updateMock = jest.fn().mockResolvedValue(undefined);
    const resetErrorMock = jest.fn();

    const classes: ClassRoom[] = [
      {
        id: 'class-1',
        name: 'Turma A',
        capacity: 25,
        studentIds: [],
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      },
    ];

    const configs: Record<string, EvaluationConfig> = {
      'class-1': {
        classId: 'class-1',
        criteria: [{ id: 'crit-1', name: 'Prova', weight: 100 }],
        updatedAt: '2025-02-01T10:00:00.000Z',
      },
    };

    const upcoming: UpcomingEvaluation[] = [
      {
        id: 'eval-1',
        classId: 'class-1',
        title: 'Prova mensal',
        scheduledAt: '2025-02-15T14:00:00.000Z',
      },
    ];

    mockedUseEvaluations.mockReturnValue(
      createState({
        classes,
        configs,
        upcomingEvaluations: upcoming,
        refresh: refreshMock,
        updateConfig: updateMock,
        resetError: resetErrorMock,
      }),
    );

    const user = userEvent.setup();

    render(<EvaluationsPage />);

    expect(screen.getByText('Turmas configuradas')).toBeInTheDocument();
    expect(screen.getByTestId('upcoming-list')).toHaveTextContent('upcoming:1|classes:1');

    const submitButton = await screen.findByRole('button', { name: 'Salvar critérios' });
    await user.click(submitButton);

    expect(updateMock).toHaveBeenCalledWith('class-1', { criteria: [{ id: 'crit-1', name: 'Prova', weight: 100 }] });

    const refreshButton = screen.getByRole('button', { name: 'Atualizar' });
    await user.click(refreshButton);
    expect(refreshMock).toHaveBeenCalled();

    const cancelButton = await screen.findByRole('button', { name: 'Descartar alterações' });
    await user.click(cancelButton);
    expect(resetErrorMock).toHaveBeenCalled();
  });

  it('shows an error alert when the hook returns an error', () => {
    mockedUseEvaluations.mockReturnValue(
      createState({
        error: { message: 'Falha ao carregar avaliações.' },
      }),
    );

    render(<EvaluationsPage />);

    expect(screen.getByText('Falha ao carregar avaliações.')).toBeInTheDocument();
  });
});
