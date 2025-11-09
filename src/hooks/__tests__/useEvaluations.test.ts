import { act, renderHook, waitFor } from '@testing-library/react';

import { useEvaluations } from '../useEvaluations';
import { classService } from '../../services/classService';
import { evaluationService } from '../../services/evaluationService';
import type { ClassRoom, EvaluationConfig, UpcomingEvaluation } from '../../types';

jest.mock('../../services/classService', () => ({
  classService: {
    list: jest.fn(),
  },
}));

jest.mock('../../services/evaluationService', () => ({
  evaluationService: {
    listConfigs: jest.fn(),
    listUpcoming: jest.fn(),
    updateConfig: jest.fn(),
  },
}));

describe('useEvaluations', () => {
  const mockedClassService = classService as jest.Mocked<typeof classService>;
  const mockedEvaluationService = evaluationService as jest.Mocked<typeof evaluationService>;

  const createSampleClasses = (): ClassRoom[] => [
    {
      id: 'class-1',
      name: 'Turma A',
      capacity: 25,
      studentIds: ['student-1'],
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-02T00:00:00.000Z',
    },
    {
      id: 'class-2',
      name: 'Turma B',
      capacity: 20,
      studentIds: [],
      createdAt: '2025-01-03T00:00:00.000Z',
      updatedAt: '2025-01-04T00:00:00.000Z',
    },
  ];

  const createSampleConfigs = (): EvaluationConfig[] => [
    {
      classId: 'class-1',
      criteria: [
        { id: 'c1', name: 'Prova', weight: 60 },
        { id: 'c2', name: 'Trabalho', weight: 40 },
      ],
      updatedAt: '2025-02-10T12:00:00.000Z',
    },
  ];

  const createUpcomingEvaluations = (): UpcomingEvaluation[] => [
    {
      id: 'eval-2',
      classId: 'class-2',
      title: 'Seminário',
      scheduledAt: '2025-04-12T09:00:00.000Z',
    },
    {
      id: 'eval-1',
      classId: 'class-1',
      title: 'Prova Bimestral',
      scheduledAt: '2025-03-15T13:30:00.000Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads classes, configs, and upcoming evaluations on mount', async () => {
    const classes = createSampleClasses();
    const configs = createSampleConfigs();
    const upcoming = createUpcomingEvaluations();

    mockedClassService.list.mockResolvedValueOnce(classes);
    mockedEvaluationService.listConfigs.mockResolvedValueOnce(configs);
    mockedEvaluationService.listUpcoming.mockResolvedValueOnce(upcoming);

    const { result } = renderHook(() => useEvaluations());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.classes).toEqual(classes);
    expect(result.current.configs).toEqual({
      'class-1': configs[0],
    });
    expect(result.current.upcomingEvaluations).toEqual([
      {
        id: 'eval-1',
        classId: 'class-1',
        title: 'Prova Bimestral',
        scheduledAt: '2025-03-15T13:30:00.000Z',
      },
      {
        id: 'eval-2',
        classId: 'class-2',
        title: 'Seminário',
        scheduledAt: '2025-04-12T09:00:00.000Z',
      },
    ]);
    expect(result.current.error).toBeNull();
  });

  it('exposes an error when the initial load fails', async () => {
    const loadError = new Error('Falha ao carregar avaliações');

    mockedClassService.list.mockRejectedValueOnce(loadError);
    mockedEvaluationService.listConfigs.mockResolvedValueOnce([]);
    mockedEvaluationService.listUpcoming.mockResolvedValueOnce([]);

    const { result } = renderHook(() => useEvaluations());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error?.message).toBe('Falha ao carregar avaliações');
  });

  it('refreshes data and clears previous errors', async () => {
    const initialClasses = createSampleClasses();
    const initialConfigs = createSampleConfigs();
    const initialUpcoming = createUpcomingEvaluations();

    const refreshedClasses = [
      { ...initialClasses[0] },
      {
        id: 'class-3',
        name: 'Turma C',
        capacity: 18,
        studentIds: [],
        createdAt: '2025-02-01T00:00:00.000Z',
        updatedAt: '2025-02-02T00:00:00.000Z',
      },
    ];
    const refreshedConfigs: EvaluationConfig[] = [
      ...initialConfigs,
      {
        classId: 'class-3',
        criteria: [{ id: 'c3', name: 'Projeto', weight: 100 }],
        updatedAt: '2025-03-01T10:00:00.000Z',
      },
    ];
    const refreshedUpcoming: UpcomingEvaluation[] = [
      {
        id: 'eval-3',
        classId: 'class-3',
        title: 'Projeto Final',
        scheduledAt: '2025-05-10T15:00:00.000Z',
      },
    ];

    mockedClassService.list
      .mockResolvedValueOnce(initialClasses)
      .mockResolvedValueOnce(refreshedClasses);
    mockedEvaluationService.listConfigs
      .mockResolvedValueOnce(initialConfigs)
      .mockResolvedValueOnce(refreshedConfigs);
    mockedEvaluationService.listUpcoming
      .mockResolvedValueOnce(initialUpcoming)
      .mockResolvedValueOnce(refreshedUpcoming);

    const { result } = renderHook(() => useEvaluations());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.refresh();
    });

    await waitFor(() => expect(result.current.classes).toEqual(refreshedClasses));
    expect(result.current.configs).toEqual({
      'class-1': initialConfigs[0],
      'class-3': refreshedConfigs[1],
    });
    expect(result.current.upcomingEvaluations).toEqual(refreshedUpcoming);
    expect(result.current.error).toBeNull();
  });

  it('updates a class configuration and keeps state in sync', async () => {
    const classes = createSampleClasses();
    const configs = createSampleConfigs();
    const upcoming = createUpcomingEvaluations();

    mockedClassService.list.mockResolvedValueOnce(classes);
    mockedEvaluationService.listConfigs.mockResolvedValueOnce(configs);
    mockedEvaluationService.listUpcoming.mockResolvedValueOnce(upcoming);

    const updatedConfig: EvaluationConfig = {
      classId: 'class-1',
      criteria: [
        { id: 'c1', name: 'Prova', weight: 50 },
        { id: 'c3', name: 'Seminário', weight: 50 },
      ],
      updatedAt: '2025-02-15T08:00:00.000Z',
    };

    mockedEvaluationService.updateConfig.mockResolvedValueOnce(updatedConfig);

    const { result } = renderHook(() => useEvaluations());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.updateConfig('class-1', { criteria: updatedConfig.criteria });
    });

    expect(mockedEvaluationService.updateConfig).toHaveBeenCalledWith('class-1', {
      criteria: updatedConfig.criteria,
    });
    expect(result.current.configs['class-1']).toEqual(updatedConfig);
    expect(result.current.error).toBeNull();
    expect(result.current.isMutating).toBe(false);
  });
});
