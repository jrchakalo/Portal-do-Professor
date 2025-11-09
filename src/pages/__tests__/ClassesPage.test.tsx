import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';

import { render, screen, waitFor, within } from '../../test-utils';
import ClassesPage from '../ClassesPage';
import { useClasses } from '../../hooks/useClasses';
import { useNavigate } from 'react-router-dom';
import type { ClassRoom } from '../../types';
import type { ClassFormValues } from '../../components/classes/ClassForm';

interface MockClassFormDialogProps {
  open: boolean;
  mode: 'create' | 'edit';
  defaultValues?: ClassFormValues;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (values: ClassFormValues) => Promise<void> | void;
  errorMessage?: string | null;
}

interface MockDeleteClassDialogProps {
  open: boolean;
  className?: string;
  isSubmitting?: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
}

interface ClassesSummary {
  totalClasses: number;
  filledClasses: number;
  classesWithVacancies: number;
  totalCapacity: number;
  totalEnrolled: number;
  occupancyRate: number;
}

interface UseClassesState {
  classes: ClassRoom[];
  isLoading: boolean;
  isMutating: boolean;
  error: { message: string } | null;
  summary: ClassesSummary;
  refresh: () => Promise<void>;
  createClass: (input: ClassFormValues) => Promise<ClassRoom>;
  updateClass: (id: string, changes: Partial<ClassFormValues>) => Promise<ClassRoom>;
  deleteClass: (id: string) => Promise<void>;
  resetError: () => void;
}

const classFormDialogSpy = jest.fn((props: MockClassFormDialogProps) => props);
const deleteClassDialogSpy = jest.fn((props: MockDeleteClassDialogProps) => props);

jest.mock('../../hooks/useClasses', () => ({
  useClasses: jest.fn(),
}));

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useNavigate: jest.fn(),
  };
});

jest.mock('../../components/classes/ClassFormDialog', () => ({
  ClassFormDialog: (props: MockClassFormDialogProps) => {
    classFormDialogSpy(props);
    if (!props.open) {
      return null;
    }

    return (
      <div data-testid="class-form-dialog" data-mode={props.mode}>
        <button type="button" onClick={() => props.onSubmit({ name: 'Dialog Turma', capacity: 40 })}>
          dialog-submit
        </button>
        <button type="button" onClick={props.onClose}>
          dialog-close
        </button>
        {props.errorMessage ? <span data-testid="class-form-error">{props.errorMessage}</span> : null}
      </div>
    );
  },
}));

jest.mock('../../components/classes/DeleteClassDialog', () => ({
  DeleteClassDialog: (props: MockDeleteClassDialogProps) => {
    deleteClassDialogSpy(props);
    if (!props.open) {
      return null;
    }

    return (
      <div data-testid="delete-class-dialog" data-class-name={props.className ?? ''}>
        <button type="button" onClick={() => props.onConfirm()}>
          dialog-confirm
        </button>
        <button type="button" onClick={props.onClose}>
          dialog-close
        </button>
      </div>
    );
  },
}));


type UseClassesMock = jest.MockedFunction<typeof useClasses>;
const mockedUseClasses = useClasses as UseClassesMock;
const mockedUseNavigate = useNavigate as jest.Mock;

const createSummary = (summary?: Partial<ClassesSummary>): ClassesSummary => ({
  totalClasses: 2,
  filledClasses: 1,
  classesWithVacancies: 1,
  totalCapacity: 70,
  totalEnrolled: 50,
  occupancyRate: 50 / 70,
  ...summary,
});

const createState = (overrides: Partial<UseClassesState> = {}): UseClassesState => ({
  classes: [],
  isLoading: false,
  isMutating: false,
  error: null,
  summary: createSummary(),
  refresh: jest.fn().mockResolvedValue(undefined),
  createClass: jest.fn().mockResolvedValue({
    id: 'new-class',
    name: 'Nova Turma',
    capacity: 40,
    studentIds: [],
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  }),
  updateClass: jest.fn().mockResolvedValue({
    id: 'class-1',
    name: 'Turma Atualizada',
    capacity: 35,
    studentIds: ['student-1'],
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-10T00:00:00.000Z',
  }),
  deleteClass: jest.fn().mockResolvedValue(undefined),
  resetError: jest.fn(),
  ...overrides,
});

describe('ClassesPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseNavigate.mockReturnValue(jest.fn());
  });

  it('renders summary information and class rows', () => {
    const classes: ClassRoom[] = [
      {
        id: 'class-1',
        name: 'Turma A',
        capacity: 30,
        studentIds: Array.from({ length: 30 }, (_, index) => `student-${index}`),
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-02-01T00:00:00.000Z',
      },
      {
        id: 'class-2',
        name: 'Turma B',
        capacity: 40,
        studentIds: Array.from({ length: 20 }, (_, index) => `student-${index}`),
        createdAt: '2025-01-02T00:00:00.000Z',
        updatedAt: '2025-02-05T00:00:00.000Z',
      },
    ];

    mockedUseClasses.mockReturnValue(
      createState({
        classes,
        summary: createSummary({
          totalClasses: 2,
          filledClasses: 1,
          classesWithVacancies: 1,
          totalCapacity: 70,
          totalEnrolled: 50,
          occupancyRate: 50 / 70,
        }),
      }),
    );

    render(<ClassesPage />);

    expect(screen.getByText('Turmas')).toBeInTheDocument();
    expect(screen.getByText('Total de turmas')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  expect(screen.getByText('Turmas lotadas')).toBeInTheDocument();
  expect(screen.getByText('Vagas disponíveis')).toBeInTheDocument();
  expect(screen.getByText('71%')).toBeInTheDocument();

  const table = screen.getByRole('table');
  expect(within(table).getByText('Turma A')).toBeInTheDocument();
  expect(within(table).getByText('Turma B')).toBeInTheDocument();
  });

  it('filters classes by search term and occupancy', async () => {
    const user = userEvent.setup();
    const classes: ClassRoom[] = [
      {
        id: 'class-1',
        name: 'Turma Matemática',
        capacity: 20,
        studentIds: Array.from({ length: 10 }, (_, index) => `student-${index}`),
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-05T00:00:00.000Z',
      },
      {
        id: 'class-2',
        name: 'Turma História',
        capacity: 20,
        studentIds: Array.from({ length: 20 }, (_, index) => `student-${index}`),
        createdAt: '2025-01-03T00:00:00.000Z',
        updatedAt: '2025-01-07T00:00:00.000Z',
      },
    ];

    mockedUseClasses.mockReturnValue(createState({ classes }));

    render(<ClassesPage />);

    const searchInput = screen.getByPlaceholderText('Nome da turma');
    await user.type(searchInput, 'física');
  expect(screen.getByText('Nenhuma turma encontrada com os filtros selecionados.')).toBeInTheDocument();

    await user.clear(searchInput);
    await user.type(searchInput, 'história');
  const table = screen.getByRole('table');
  expect(within(table).queryByText('Turma Matemática')).not.toBeInTheDocument();
  expect(within(table).getByText('Turma História')).toBeInTheDocument();

  await user.clear(searchInput);
  expect(within(table).getByText('Turma Matemática')).toBeInTheDocument();
  expect(within(table).getByText('Turma História')).toBeInTheDocument();

    const select = screen.getByLabelText('Ocupação');
    await user.selectOptions(select, 'available');
  expect(within(table).queryByText('Turma História')).not.toBeInTheDocument();
  expect(within(table).getByText('Turma Matemática')).toBeInTheDocument();

    await user.selectOptions(select, 'full');
  expect(within(table).getByText('Turma História')).toBeInTheDocument();
  expect(within(table).queryByText('Turma Matemática')).not.toBeInTheDocument();
  });

  it('handles refresh, creation, edition, deletion, and navigation actions', async () => {
    const user = userEvent.setup();
    const navigateMock = jest.fn();
    mockedUseNavigate.mockReturnValue(navigateMock);

    const classes: ClassRoom[] = [
      {
        id: 'class-1',
        name: 'Turma Central',
        capacity: 30,
        studentIds: ['student-1', 'student-2'],
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-08T00:00:00.000Z',
      },
    ];

    const refresh = jest.fn().mockResolvedValue(undefined);
    const createClass = jest.fn().mockResolvedValue({
      id: 'class-99',
      name: 'Dialog Turma',
      capacity: 40,
      studentIds: [],
      createdAt: '2025-02-01T00:00:00.000Z',
      updatedAt: '2025-02-01T00:00:00.000Z',
    });
    const updateClass = jest.fn().mockResolvedValue({
      id: 'class-1',
      name: 'Dialog Turma',
      capacity: 40,
      studentIds: ['student-1'],
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-02-10T00:00:00.000Z',
    });
    const deleteClass = jest.fn().mockResolvedValue(undefined);
    const resetError = jest.fn();

    mockedUseClasses.mockReturnValue(
      createState({
        classes,
        refresh,
        createClass,
        updateClass,
        deleteClass,
        resetError,
      }),
    );

    render(<ClassesPage />);

    await user.click(screen.getByRole('button', { name: 'Atualizar' }));
    expect(resetError).toHaveBeenCalled();
    expect(refresh).toHaveBeenCalled();

  await user.click(screen.getByRole('button', { name: 'Nova turma' }));
  expect(classFormDialogSpy).toHaveBeenCalledWith(expect.objectContaining({ open: true, mode: 'create' }));
  await user.click(await screen.findByText('dialog-submit'));
  await waitFor(() => expect(createClass).toHaveBeenCalledWith({ name: 'Dialog Turma', capacity: 40 }));

    await user.click(screen.getByRole('button', { name: 'Editar turma' }));
    expect(classFormDialogSpy).toHaveBeenCalledWith(expect.objectContaining({ open: true, mode: 'edit' }));
  await user.click(await screen.findByText('dialog-submit'));
  await waitFor(() => expect(updateClass).toHaveBeenCalledWith('class-1', { name: 'Dialog Turma', capacity: 40 }));

    await user.click(screen.getByRole('button', { name: 'Remover turma' }));
    expect(deleteClassDialogSpy).toHaveBeenCalledWith(expect.objectContaining({ open: true, className: 'Turma Central' }));
  await user.click(await screen.findByText('dialog-confirm'));
  await waitFor(() => expect(deleteClass).toHaveBeenCalledWith('class-1'));

    await user.click(screen.getByRole('button', { name: 'Configurar avaliações' }));
    expect(navigateMock).toHaveBeenCalledWith('/turmas/class-1/avaliacoes');
  });

  it('shows an error alert when the hook reports one', () => {
    mockedUseClasses.mockReturnValue(
      createState({
        error: { message: 'Falha ao carregar turmas.' },
      }),
    );

    render(<ClassesPage />);

    expect(screen.getByText('Falha ao carregar turmas.')).toBeInTheDocument();
  });
});
