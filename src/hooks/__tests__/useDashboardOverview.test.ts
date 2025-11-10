import { renderHook, waitFor } from '@testing-library/react';

import { useDashboardOverview } from '../useDashboardOverview';
import { mockServer } from '../../services/mockServer';
import type {
  ClassRoom,
  EvaluationConfig,
  Student,
  UpcomingEvaluation,
  User,
} from '../../types';

describe('useDashboardOverview', () => {
  const snapshotSpy = jest.spyOn(mockServer, 'snapshot');

  const createClass = (overrides: Partial<ClassRoom>): ClassRoom => ({
    id: `class-${Math.random().toString(16).slice(2, 6)}`,
    name: 'Turma base',
    capacity: 30,
    studentIds: [],
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    ...overrides,
  });

  const createStudent = (overrides: Partial<Student>): Student => ({
    id: `student-${Math.random().toString(16).slice(2, 6)}`,
    name: 'Aluno',
    email: 'aluno@example.com',
    classId: null,
    status: 'inactive',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    ...overrides,
  });

  const createConfig = (overrides: Partial<EvaluationConfig>): EvaluationConfig => ({
    classId: 'class-config',
    updatedAt: '2025-01-01T00:00:00.000Z',
    criteria: [
      { id: 'criterion-1', name: 'Critério 1', weight: 60 },
      { id: 'criterion-2', name: 'Critério 2', weight: 40 },
    ],
    ...overrides,
  });

  const createEvaluation = (overrides: Partial<UpcomingEvaluation>): UpcomingEvaluation => ({
    id: `evaluation-${Math.random().toString(16).slice(2, 6)}`,
    classId: 'class-eval',
    title: 'Avaliação base',
    scheduledAt: '2025-01-10T10:00:00.000Z',
    ...overrides,
  });

  const emptyUsers: User[] = [];

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns initial loading state and maps snapshot data into dashboard structures', async () => {
    const classA = createClass({ id: 'class-a', name: 'Turma Alpha', capacity: 40, studentIds: ['student-1', 'student-2', 'student-3', 'student-4'], updatedAt: '2025-02-01T00:00:00.000Z' });
    const classB = createClass({ id: 'class-b', name: 'Turma Beta', capacity: 10, studentIds: ['student-5', 'student-6'], updatedAt: '2025-02-02T00:00:00.000Z' });
    const classC = createClass({ id: 'class-c', name: 'Turma Gama', capacity: 25, studentIds: [], updatedAt: '2025-02-03T00:00:00.000Z' });

    const students: Student[] = [
      createStudent({ id: 'student-1', classId: 'class-a', status: 'active' }),
      createStudent({ id: 'student-2', classId: 'class-a', status: 'active' }),
      createStudent({ id: 'student-3', classId: 'class-a', status: 'inactive' }),
      createStudent({ id: 'student-4', classId: 'class-a', status: 'active' }),
      createStudent({ id: 'student-5', classId: 'class-b', status: 'inactive' }),
      createStudent({ id: 'student-6', classId: 'class-b', status: 'inactive' }),
    ];

    const configs: EvaluationConfig[] = [
      createConfig({ classId: 'class-a', updatedAt: '2025-02-05T10:00:00.000Z' }),
      createConfig({
        classId: 'class-b',
        updatedAt: '2025-02-08T10:00:00.000Z',
        criteria: [
          { id: 'criterion-3', name: 'Seminário', weight: 70 },
          { id: 'criterion-4', name: 'Projeto', weight: 20 },
          { id: 'criterion-5', name: 'Participação', weight: 10 },
        ],
      }),
    ];

    const upcoming: UpcomingEvaluation[] = [
      createEvaluation({ id: 'evaluation-b', classId: 'class-b', title: 'Avaliação Beta', scheduledAt: '2025-02-10T08:00:00.000Z' }),
      createEvaluation({ id: 'evaluation-a', classId: 'class-a', title: 'Avaliação Alpha', scheduledAt: '2025-02-09T08:00:00.000Z' }),
    ];

    snapshotSpy.mockReturnValueOnce({
      users: emptyUsers,
      classes: [classA, classB, classC],
      students,
      evaluationConfigs: configs,
      upcomingEvaluations: upcoming,
    });

  const { result } = renderHook(() => useDashboardOverview());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.metrics).toEqual({ students: 6, classes: 3, activeStudents: 3 });

    expect(result.current.evaluations.map((evaluation) => evaluation.id)).toEqual([
      'evaluation-a',
      'evaluation-b',
    ]);

    expect(result.current.nextEvaluation?.id).toBe('evaluation-a');

    const classSummariesById = Object.fromEntries(result.current.classSummaries.map((summary) => [summary.id, summary]));
    expect(classSummariesById['class-a']).toMatchObject({
      totalStudents: 4,
      activeCount: 3,
      inactiveCount: 1,
      occupancyPercent: 10,
    });
    expect(classSummariesById['class-b']).toMatchObject({
      totalStudents: 2,
      activeCount: 0,
      inactiveCount: 2,
      occupancyPercent: 20,
    });

    expect(result.current.pendingEvaluations.map((reminder) => reminder.id)).toEqual(['class-c']);

    expect(result.current.evaluationConfigs[0]).toMatchObject({
      id: 'class-b',
      criteriaCount: 3,
      totalWeight: 100,
      isWeightBalanced: true,
    });

    expect(result.current.studentStatus).toEqual({ active: 3, inactive: 3, total: 6 });

    expect(result.current.capacityAlerts).toEqual([]);
  });

  it('falls back to default names and builds capacity alerts for crowded classes', async () => {
    const classLonely = createClass({ id: 'class-lonely', name: 'Turma Solitária', capacity: 5, studentIds: ['student-1', 'student-2', 'student-3', 'student-4', 'student-5'] });

    const students: Student[] = [
      createStudent({ id: 'student-1', classId: 'class-lonely', status: 'inactive' }),
      createStudent({ id: 'student-2', classId: 'class-lonely', status: 'inactive' }),
      createStudent({ id: 'student-3', classId: 'class-lonely', status: 'inactive' }),
      createStudent({ id: 'student-4', classId: 'class-lonely', status: 'inactive' }),
      createStudent({ id: 'student-5', classId: 'class-lonely', status: 'inactive' }),
    ];

    const configs: EvaluationConfig[] = [
      createConfig({ classId: 'class-missing', updatedAt: '2025-03-05T08:00:00.000Z' }),
    ];

    const upcoming: UpcomingEvaluation[] = [
      createEvaluation({ id: 'evaluation-missing', classId: 'class-missing', title: 'Avaliação Fantasma', scheduledAt: '2025-03-10T09:00:00.000Z' }),
    ];

    snapshotSpy.mockReturnValueOnce({
      users: emptyUsers,
      classes: [classLonely],
      students,
      evaluationConfigs: configs,
      upcomingEvaluations: upcoming,
    });

    const { result } = renderHook(() => useDashboardOverview());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.evaluations[0]).toMatchObject({ className: 'Turma desconhecida' });
    expect(result.current.evaluationConfigs[0]).toMatchObject({ className: 'Turma desconhecida', isWeightBalanced: true });

    expect(result.current.capacityAlerts[0]).toMatchObject({
      id: 'class-lonely',
      occupancyPercent: 100,
    });
  });
});
