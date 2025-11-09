import { act, renderHook, waitFor } from '@testing-library/react';

import { useClasses } from '../useClasses';
import { classService } from '../../services/classService';
import type { ClassRoom } from '../../types';

jest.mock('../../services/classService', () => ({
  classService: {
    list: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  },
}));

describe('useClasses', () => {
  const mockedClassService = classService as jest.Mocked<typeof classService>;

  const createSampleClasses = (): ClassRoom[] => [
    {
      id: 'class-1',
      name: 'Turma A',
      capacity: 30,
      studentIds: Array.from({ length: 20 }, (_, index) => `student-${index}`),
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-02T00:00:00.000Z',
    },
    {
      id: 'class-2',
      name: 'Turma B',
      capacity: 25,
      studentIds: Array.from({ length: 25 }, (_, index) => `student-${index}`),
      createdAt: '2025-01-05T00:00:00.000Z',
      updatedAt: '2025-01-06T00:00:00.000Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads classes on mount and computes summary', async () => {
    const classes = createSampleClasses();

    mockedClassService.list.mockResolvedValueOnce(classes);

    const { result } = renderHook(() => useClasses());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.classes).toEqual(classes);
    expect(result.current.summary).toEqual({
      totalClasses: 2,
      filledClasses: 1,
      classesWithVacancies: 1,
      totalCapacity: 55,
      totalEnrolled: 45,
      occupancyRate: 45 / 55,
    });
    expect(result.current.error).toBeNull();
  });

  it('handles errors during initial load', async () => {
    const loadError = new Error('Falha ao listar turmas');

    mockedClassService.list.mockRejectedValueOnce(loadError);

    const { result } = renderHook(() => useClasses());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error?.message).toBe('Falha ao listar turmas');
  });

  it('refreshes classes and clears the previous error', async () => {
    const initialClasses = createSampleClasses();
    const refreshedClasses: ClassRoom[] = [
      { ...initialClasses[0], name: 'Turma A+' },
      {
        id: 'class-3',
        name: 'Turma C',
        capacity: 40,
        studentIds: Array.from({ length: 10 }, (_, index) => `student-${index}`),
        createdAt: '2025-02-01T00:00:00.000Z',
        updatedAt: '2025-02-02T00:00:00.000Z',
      },
    ];

    mockedClassService.list.mockResolvedValueOnce(initialClasses).mockResolvedValueOnce(refreshedClasses);

    const { result } = renderHook(() => useClasses());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.refresh();
    });

    await waitFor(() => expect(result.current.classes).toEqual(refreshedClasses));
    expect(result.current.error).toBeNull();
  });

  it('creates a class and appends it to the state', async () => {
    const initialClasses = createSampleClasses();
    const createdClass: ClassRoom = {
      id: 'class-3',
      name: 'Turma Nova',
      capacity: 35,
      studentIds: [],
      createdAt: '2025-03-01T00:00:00.000Z',
      updatedAt: '2025-03-01T00:00:00.000Z',
    };

    mockedClassService.list.mockResolvedValueOnce(initialClasses);
    mockedClassService.create.mockResolvedValueOnce(createdClass);

    const { result } = renderHook(() => useClasses());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.createClass({ name: createdClass.name, capacity: createdClass.capacity });
    });

    expect(mockedClassService.create).toHaveBeenCalledWith({ name: createdClass.name, capacity: createdClass.capacity });
    expect(result.current.classes).toEqual([...initialClasses, createdClass]);
    expect(result.current.error).toBeNull();
    expect(result.current.isMutating).toBe(false);
  });

  it('updates a class and replaces it in the state', async () => {
    const initialClasses = createSampleClasses();
    const updatedClass: ClassRoom = {
      ...initialClasses[0],
      name: 'Turma A Atualizada',
      updatedAt: '2025-03-05T00:00:00.000Z',
    };

    mockedClassService.list.mockResolvedValueOnce(initialClasses);
    mockedClassService.update.mockResolvedValueOnce(updatedClass);

    const { result } = renderHook(() => useClasses());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.updateClass('class-1', { name: 'Turma A Atualizada' });
    });

    expect(mockedClassService.update).toHaveBeenCalledWith('class-1', { name: 'Turma A Atualizada' });
    expect(result.current.classes[0]).toEqual(updatedClass);
    expect(result.current.error).toBeNull();
  });

  it('deletes a class and removes it from the state', async () => {
    const initialClasses = createSampleClasses();

    mockedClassService.list.mockResolvedValueOnce(initialClasses);
    mockedClassService.remove.mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useClasses());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.deleteClass('class-2');
    });

    expect(mockedClassService.remove).toHaveBeenCalledWith('class-2');
    expect(result.current.classes).toEqual([initialClasses[0]]);
    expect(result.current.error).toBeNull();
  });
});
