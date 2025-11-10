import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';

import { render, screen, waitFor, within } from '../../test-utils';
import StudentsPage from '../StudentsPage';
import { useStudents } from '../../hooks/useStudents';
import type { ClassRoom, Student } from '../../types';
import type { StudentFormValues } from '../../components/students/StudentForm';
import type { UpdateStudentInput } from '../../types/student';

type StudentsError = { message: string; cause?: unknown } | null;

interface UseStudentsState {
  students: Student[];
  classes: ClassRoom[];
  isLoading: boolean;
  isMutating: boolean;
  error: StudentsError;
  refresh: () => Promise<void>;
  createStudent: (input: StudentFormValues) => Promise<Student>;
  updateStudent: (id: string, changes: UpdateStudentInput) => Promise<Student>;
  deleteStudent: (id: string) => Promise<void>;
  resetError: () => void;
}

interface MockStudentFormDialogProps {
  open: boolean;
  mode: 'create' | 'edit';
  classes: ClassRoom[];
  defaultValues?: StudentFormValues;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (values: StudentFormValues) => Promise<void> | void;
  errorMessage?: string | null;
}

interface MockDeleteStudentDialogProps {
  open: boolean;
  studentName?: string;
  isSubmitting?: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
}

const studentFormDialogSpy = jest.fn((props: MockStudentFormDialogProps) => props);
const deleteStudentDialogSpy = jest.fn((props: MockDeleteStudentDialogProps) => props);

const dialogValues: StudentFormValues = {
  name: 'Dialog Student',
  email: 'dialog.student@example.com',
  classId: 'class-2',
  status: 'active',
};

jest.mock('../../hooks/useStudents', () => ({
  useStudents: jest.fn(),
}));

jest.mock('../../components/students/StudentFormDialog', () => ({
  StudentFormDialog: (props: MockStudentFormDialogProps) => {
    studentFormDialogSpy(props);

    if (!props.open) {
      return null;
    }

    return (
      <div data-testid="student-form-dialog" data-mode={props.mode}>
        {props.errorMessage ? <span data-testid="student-form-error">{props.errorMessage}</span> : null}
        <button type="button" onClick={() => props.onSubmit(dialogValues)}>
          dialog-submit
        </button>
        <button type="button" onClick={props.onClose}>
          dialog-close
        </button>
      </div>
    );
  },
}));

jest.mock('../../components/students/DeleteStudentDialog', () => ({
  DeleteStudentDialog: (props: MockDeleteStudentDialogProps) => {
    deleteStudentDialogSpy(props);

    if (!props.open) {
      return null;
    }

    return (
      <div data-testid="delete-student-dialog" data-student-name={props.studentName ?? ''}>
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

type UseStudentsMock = jest.MockedFunction<typeof useStudents>;
const mockedUseStudents = useStudents as UseStudentsMock;

const createClasses = (): ClassRoom[] => [
  {
    id: 'class-1',
    name: 'Turma A',
    capacity: 30,
    studentIds: ['student-1'],
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-02T00:00:00.000Z',
  },
  {
    id: 'class-2',
    name: 'Turma B',
    capacity: 25,
    studentIds: ['student-3'],
    createdAt: '2025-01-05T00:00:00.000Z',
    updatedAt: '2025-01-06T00:00:00.000Z',
  },
];

const createStudents = (): Student[] => [
  {
    id: 'student-1',
    name: 'Ana Silva',
    email: 'ana.silva@example.com',
    classId: 'class-1',
    status: 'active',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-02T00:00:00.000Z',
  },
  {
    id: 'student-2',
    name: 'Bruno Souza',
    email: 'bruno.souza@example.com',
    classId: null,
    status: 'inactive',
    createdAt: '2025-01-05T00:00:00.000Z',
    updatedAt: '2025-01-06T00:00:00.000Z',
  },
  {
    id: 'student-3',
    name: 'Carla Lima',
    email: 'carla.lima@example.com',
    classId: 'class-2',
    status: 'active',
    createdAt: '2025-02-01T00:00:00.000Z',
    updatedAt: '2025-02-02T00:00:00.000Z',
  },
];

const createState = (overrides: Partial<UseStudentsState> = {}): UseStudentsState => ({
  students: [],
  classes: [],
  isLoading: false,
  isMutating: false,
  error: null,
  refresh: jest.fn().mockResolvedValue(undefined),
  createStudent: jest.fn().mockResolvedValue({
    id: 'student-new',
    name: dialogValues.name,
    email: dialogValues.email,
    classId: dialogValues.classId,
    status: dialogValues.status,
    createdAt: '2025-03-01T00:00:00.000Z',
    updatedAt: '2025-03-01T00:00:00.000Z',
  }),
  updateStudent: jest.fn().mockResolvedValue({
    id: 'student-1',
    name: dialogValues.name,
    email: dialogValues.email,
    classId: dialogValues.classId,
    status: dialogValues.status,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-03-10T00:00:00.000Z',
  }),
  deleteStudent: jest.fn().mockResolvedValue(undefined),
  resetError: jest.fn(),
  ...overrides,
});

describe('StudentsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders student rows with class and status information', () => {
    const classes = createClasses();
    const students = createStudents();

    mockedUseStudents.mockReturnValue(createState({ classes, students }));

    render(<StudentsPage />);

    expect(screen.getByText('Alunos')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Novo aluno' })).toBeInTheDocument();

    const table = screen.getByRole('table');
    const dataRows = within(table)
      .getAllByRole('row')
      .slice(1);

    const [firstRow, secondRow, thirdRow] = dataRows;

    expect(within(firstRow).getByText('Ana Silva')).toBeInTheDocument();
    expect(within(firstRow).getByText('ana.silva@example.com')).toBeInTheDocument();
    expect(within(firstRow).getByText('Turma A')).toBeInTheDocument();
    expect(within(firstRow).getByText('Ativo')).toBeInTheDocument();

    expect(within(secondRow).getByText('Bruno Souza')).toBeInTheDocument();
    expect(within(secondRow).getByText('Sem turma vinculada')).toBeInTheDocument();
    expect(within(secondRow).getByText('Inativo')).toBeInTheDocument();

    expect(within(thirdRow).getByText('Carla Lima')).toBeInTheDocument();
    expect(within(thirdRow).getByText('Turma B')).toBeInTheDocument();
    expect(within(thirdRow).getByText('Ativo')).toBeInTheDocument();
  });

  it('filters students by search, status, and class', async () => {
    const user = userEvent.setup();
    const classes = createClasses();
    const students = createStudents();

    mockedUseStudents.mockReturnValue(createState({ classes, students }));

    render(<StudentsPage />);

    const searchInput = screen.getByLabelText('Buscar');

    await user.type(searchInput, 'engenharia');
    expect(
      screen.getByText('Nenhum aluno encontrado com os filtros selecionados.'),
    ).toBeInTheDocument();

    await user.clear(searchInput);
    await user.type(searchInput, 'bruno');

    const table = screen.getByRole('table');

    await waitFor(() => {
      expect(within(table).getByText('Bruno Souza')).toBeInTheDocument();
      expect(within(table).queryByText('Ana Silva')).not.toBeInTheDocument();
    });

    await user.clear(searchInput);

    const statusSelect = screen.getByLabelText('Status');
    await user.selectOptions(statusSelect, 'inactive');

    await waitFor(() => {
      expect(within(table).getByText('Bruno Souza')).toBeInTheDocument();
      expect(within(table).queryByText('Carla Lima')).not.toBeInTheDocument();
    });

    await user.selectOptions(statusSelect, 'active');

    await waitFor(() => {
      expect(within(table).getByText('Ana Silva')).toBeInTheDocument();
      expect(within(table).getByText('Carla Lima')).toBeInTheDocument();
      expect(within(table).queryByText('Bruno Souza')).not.toBeInTheDocument();
    });

    await user.selectOptions(statusSelect, 'all');

    const classSelect = screen.getByLabelText('Turma');
    await user.selectOptions(classSelect, 'class-1');

    await waitFor(() => {
      expect(within(table).getByText('Ana Silva')).toBeInTheDocument();
      expect(within(table).queryByText('Carla Lima')).not.toBeInTheDocument();
    });

    await user.selectOptions(classSelect, 'no-class');

    await waitFor(() => {
      expect(within(table).getByText('Bruno Souza')).toBeInTheDocument();
      expect(within(table).queryByText('Ana Silva')).not.toBeInTheDocument();
      expect(within(table).queryByText('Carla Lima')).not.toBeInTheDocument();
    });

    await user.selectOptions(classSelect, 'all');

    await waitFor(() => {
      expect(within(table).getByText('Ana Silva')).toBeInTheDocument();
      expect(within(table).getByText('Bruno Souza')).toBeInTheDocument();
      expect(within(table).getByText('Carla Lima')).toBeInTheDocument();
    });
  });

  it('handles refresh, creation, edition, and deletion flows', async () => {
    const user = userEvent.setup();
    const classes = createClasses();
    const students = createStudents();

    const refresh = jest.fn().mockResolvedValue(undefined);
    const createStudent = jest.fn().mockResolvedValue({
      ...students[0],
      id: 'student-new',
      name: dialogValues.name,
      email: dialogValues.email,
      classId: dialogValues.classId,
      status: dialogValues.status,
      updatedAt: '2025-03-01T00:00:00.000Z',
    });
    const updateStudent = jest.fn().mockResolvedValue({
      ...students[0],
      name: dialogValues.name,
      email: dialogValues.email,
      classId: dialogValues.classId,
      status: dialogValues.status,
      updatedAt: '2025-03-10T00:00:00.000Z',
    });
    const deleteStudent = jest.fn().mockResolvedValue(undefined);
    const resetError = jest.fn();

    mockedUseStudents.mockReturnValue(
      createState({
        classes,
        students,
        refresh,
        createStudent,
        updateStudent,
        deleteStudent,
        resetError,
      }),
    );

    render(<StudentsPage />);

    await user.click(screen.getByRole('button', { name: 'Atualizar' }));
    expect(resetError).toHaveBeenCalled();
    await waitFor(() => expect(refresh).toHaveBeenCalled());

    await user.click(screen.getByRole('button', { name: 'Novo aluno' }));
    expect(studentFormDialogSpy).toHaveBeenCalledWith(expect.objectContaining({ open: true, mode: 'create' }));

    await user.click(await screen.findByText('dialog-submit'));
    await waitFor(() => expect(createStudent).toHaveBeenCalledWith(dialogValues));

    const editButtons = screen.getAllByRole('button', { name: 'Editar aluno' });
    await user.click(editButtons[0]);

    expect(studentFormDialogSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        open: true,
        mode: 'edit',
        defaultValues: {
          name: students[0].name,
          email: students[0].email,
          classId: students[0].classId,
          status: students[0].status,
        },
      }),
    );

    await user.click(await screen.findByText('dialog-submit'));
    await waitFor(() => expect(updateStudent).toHaveBeenCalledWith('student-1', dialogValues));

    const deleteButtons = screen.getAllByRole('button', { name: 'Remover aluno' });
    await user.click(deleteButtons[1]);

    expect(deleteStudentDialogSpy).toHaveBeenCalledWith(
      expect.objectContaining({ open: true, studentName: students[1].name }),
    );

    await user.click(await screen.findByText('dialog-confirm'));
    await waitFor(() => expect(deleteStudent).toHaveBeenCalledWith('student-2'));
  });

  it('shows an error alert when the hook reports a failure', () => {
    mockedUseStudents.mockReturnValue(
      createState({
        error: { message: 'Falha ao carregar alunos.' },
      }),
    );

    render(<StudentsPage />);

    expect(screen.getByText('Falha ao carregar alunos.')).toBeInTheDocument();
  });
});
