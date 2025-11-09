import { act, renderHook, waitFor } from '@testing-library/react';

import { useStudents } from '../useStudents';
import { studentService } from '../../services/studentService';
import { classService } from '../../services/classService';
import type { ClassRoom, Student } from '../../types';
import type { CreateStudentInput, UpdateStudentInput } from '../../types/student';

jest.mock('../../services/studentService', () => ({
  studentService: {
    list: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  },
}));

jest.mock('../../services/classService', () => ({
  classService: {
    list: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  },
}));

describe('useStudents', () => {
  const mockedStudentService = studentService as jest.Mocked<typeof studentService>;
  const mockedClassService = classService as jest.Mocked<typeof classService>;

  const createSampleStudents = (): Student[] => [
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
  ];

  const createSampleClasses = (): ClassRoom[] => [
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
      studentIds: [],
      createdAt: '2025-02-01T00:00:00.000Z',
      updatedAt: '2025-02-02T00:00:00.000Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads students and classes on mount', async () => {
    const students = createSampleStudents();
    const classes = createSampleClasses();

    mockedStudentService.list.mockResolvedValueOnce(students);
    mockedClassService.list.mockResolvedValueOnce(classes);

    const { result } = renderHook(() => useStudents());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockedStudentService.list).toHaveBeenCalledTimes(1);
    expect(mockedClassService.list).toHaveBeenCalledTimes(1);
    expect(result.current.students).toEqual(students);
    expect(result.current.classes).toEqual(classes);
    expect(result.current.error).toBeNull();
    expect(result.current.isMutating).toBe(false);
  });

  it('handles errors during initial load', async () => {
    const loadError = { message: 'Falha ao carregar alunos' };

    mockedStudentService.list.mockRejectedValueOnce(loadError);
    mockedClassService.list.mockResolvedValueOnce(createSampleClasses());

    const { result } = renderHook(() => useStudents());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.students).toEqual([]);
    expect(result.current.classes).toEqual([]);
    expect(result.current.error).toMatchObject({ message: 'Falha ao carregar alunos', cause: loadError });
  });

  it('refreshes data and clears previous errors', async () => {
    const students = createSampleStudents();
    const classes = createSampleClasses();
    const refreshedStudents: Student[] = [
      {
        id: 'student-3',
        name: 'Carla Lima',
        email: 'carla.lima@example.com',
        classId: 'class-2',
        status: 'active',
        createdAt: '2025-03-01T00:00:00.000Z',
        updatedAt: '2025-03-02T00:00:00.000Z',
      },
    ];
    const refreshedClasses: ClassRoom[] = [
      {
        id: 'class-2',
        name: 'Turma B',
        capacity: 25,
        studentIds: ['student-3'],
        createdAt: '2025-02-01T00:00:00.000Z',
        updatedAt: '2025-03-02T00:00:00.000Z',
      },
    ];
    const mutationError = { message: 'Erro ao atualizar aluno' };

    mockedStudentService.list
      .mockResolvedValueOnce(students)
      .mockResolvedValueOnce(refreshedStudents);
    mockedClassService.list
      .mockResolvedValueOnce(classes)
      .mockResolvedValueOnce(refreshedClasses);
    mockedStudentService.update.mockRejectedValueOnce(mutationError);

    const { result } = renderHook(() => useStudents());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let caughtError: unknown;
    await act(async () => {
      try {
        await result.current.updateStudent('student-1', { name: 'Atualização falhou' });
      } catch (error) {
        caughtError = error;
      }
    });

    expect(caughtError).toMatchObject({ message: 'Erro ao atualizar aluno' });

    await waitFor(() =>
      expect(result.current.error).toMatchObject({ message: 'Erro ao atualizar aluno', cause: mutationError }),
    );

    await act(async () => {
      await result.current.refresh();
    });

    await waitFor(() => expect(result.current.students).toEqual(refreshedStudents));
    expect(result.current.classes).toEqual(refreshedClasses);
    expect(result.current.error).toBeNull();
  });

  it('propagates formatted errors when refresh fails', async () => {
    const students = createSampleStudents();
    const classes = createSampleClasses();
    const refreshError = { message: 'Falha ao atualizar dados' };

    mockedStudentService.list
      .mockResolvedValueOnce(students)
      .mockRejectedValueOnce(refreshError);
    mockedClassService.list
      .mockResolvedValueOnce(classes)
      .mockResolvedValueOnce(classes);

    const { result } = renderHook(() => useStudents());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let refreshErrorCaught: unknown;
    await act(async () => {
      try {
        await result.current.refresh();
      } catch (error) {
        refreshErrorCaught = error;
      }
    });

    expect(refreshErrorCaught).toMatchObject({ message: 'Falha ao atualizar dados' });

    await waitFor(() =>
      expect(result.current.error).toMatchObject({ message: 'Falha ao atualizar dados', cause: refreshError }),
    );
  });

  it('creates a student, appends it to state and triggers refresh when class is assigned', async () => {
    const students = createSampleStudents();
    const classes = createSampleClasses();
    const createdStudent: Student = {
      id: 'student-3',
      name: 'Carla Lima',
      email: 'carla.lima@example.com',
      classId: 'class-2',
      status: 'active',
      createdAt: '2025-03-01T00:00:00.000Z',
      updatedAt: '2025-03-01T00:00:00.000Z',
    };
    const refreshedStudents = [...students, createdStudent];

    mockedStudentService.list
      .mockResolvedValueOnce(students)
      .mockResolvedValueOnce(refreshedStudents);
    mockedClassService.list
      .mockResolvedValueOnce(classes)
      .mockResolvedValueOnce(classes);
    mockedStudentService.create.mockResolvedValueOnce(createdStudent);

    const { result } = renderHook(() => useStudents());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const payload: CreateStudentInput = {
      name: createdStudent.name,
      email: createdStudent.email,
      classId: createdStudent.classId,
      status: createdStudent.status,
    };

    await act(async () => {
      await result.current.createStudent(payload);
    });

    expect(mockedStudentService.create).toHaveBeenCalledWith(payload);

    expect(result.current.students).toEqual(refreshedStudents);
    await waitFor(() => expect(mockedStudentService.list).toHaveBeenCalledTimes(2));
    expect(result.current.error).toBeNull();
    expect(result.current.isMutating).toBe(false);
  });

  it('updates a student, replaces it in state and refreshes when class changes', async () => {
    const students = createSampleStudents();
    const updatedStudent: Student = {
      ...students[0],
      classId: 'class-2',
      name: 'Ana Silva Atualizada',
      updatedAt: '2025-04-01T00:00:00.000Z',
    };
    const refreshedStudents = [updatedStudent, students[1]];

    mockedStudentService.list
      .mockResolvedValueOnce(students)
      .mockResolvedValueOnce(refreshedStudents);
    mockedClassService.list
      .mockResolvedValueOnce(createSampleClasses())
      .mockResolvedValueOnce(createSampleClasses());
    mockedStudentService.update.mockResolvedValueOnce(updatedStudent);

    const { result } = renderHook(() => useStudents());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const changes: UpdateStudentInput = { name: updatedStudent.name, classId: 'class-2' };

    await act(async () => {
      await result.current.updateStudent('student-1', changes);
    });

    expect(mockedStudentService.update).toHaveBeenCalledWith('student-1', changes);
    expect(result.current.students).toEqual(refreshedStudents);
    await waitFor(() => expect(mockedStudentService.list).toHaveBeenCalledTimes(2));
    expect(result.current.error).toBeNull();
  });

  it('deletes a student and removes it from state without refreshing', async () => {
    const students = createSampleStudents();
    const classes = createSampleClasses();

    mockedStudentService.list.mockResolvedValueOnce(students);
    mockedClassService.list.mockResolvedValueOnce(classes);
    mockedStudentService.remove.mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useStudents());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.deleteStudent('student-1');
    });

    expect(mockedStudentService.remove).toHaveBeenCalledWith('student-1');
    expect(result.current.students).toEqual([students[1]]);
    expect(mockedStudentService.list).toHaveBeenCalledTimes(1);
    expect(result.current.error).toBeNull();
  });

  it('formats unexpected mutation errors and allows resetting state', async () => {
    const students = createSampleStudents();
    const classes = createSampleClasses();

    mockedStudentService.list.mockResolvedValueOnce(students);
    mockedClassService.list.mockResolvedValueOnce(classes);
    mockedStudentService.create.mockRejectedValueOnce('Erro desconhecido');

    const { result } = renderHook(() => useStudents());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const payload: CreateStudentInput = {
      name: 'Novo Aluno',
      email: 'novo.aluno@example.com',
      classId: null,
      status: 'active',
    };

    let mutationCaught: unknown;
    await act(async () => {
      try {
        await result.current.createStudent(payload);
      } catch (error) {
        mutationCaught = error;
      }
    });

    expect(mutationCaught).toMatchObject({ message: 'Erro inesperado ao processar operação com alunos.' });

    await waitFor(() =>
      expect(result.current.error).toMatchObject({ message: 'Erro inesperado ao processar operação com alunos.', cause: 'Erro desconhecido' }),
    );
    expect(result.current.isMutating).toBe(false);

    act(() => {
      result.current.resetError();
    });

    expect(result.current.error).toBeNull();
  });
});
