import { useEffect, useMemo, useState } from 'react';

import { mockServer } from '../services/mockServer';
import type { ClassRoom, EvaluationConfig, Student, UpcomingEvaluation } from '../types';

export interface OverviewMetrics {
  students: number;
  classes: number;
  activeStudents: number;
}

export interface DashboardEvaluation {
  id: string;
  title: string;
  classId: string;
  className: string;
  scheduledAt: Date;
}

export interface ClassSummary {
  id: string;
  name: string;
  capacity: number;
  totalStudents: number;
  activeCount: number;
  inactiveCount: number;
  occupancyPercent: number;
}

export interface PendingEvaluationReminder {
  id: string;
  name: string;
  studentCount: number;
  lastUpdatedAt: Date;
}

export interface EvaluationConfigSummary {
  id: string;
  className: string;
  criteriaCount: number;
  totalWeight: number;
  isWeightBalanced: boolean;
  updatedAt: Date;
}

export interface StudentStatusSummary {
  active: number;
  inactive: number;
  total: number;
}

export interface CapacityAlert {
  id: string;
  name: string;
  occupancyPercent: number;
  capacity: number;
  totalStudents: number;
}

interface DashboardOverviewState {
  metrics: OverviewMetrics;
  evaluations: DashboardEvaluation[];
  classSummaries: ClassSummary[];
  nextEvaluation: DashboardEvaluation | null;
  pendingEvaluations: PendingEvaluationReminder[];
  evaluationConfigs: EvaluationConfigSummary[];
  studentStatus: StudentStatusSummary;
  capacityAlerts: CapacityAlert[];
}

const createInitialMetrics = (): OverviewMetrics => ({
  students: 0,
  classes: 0,
  activeStudents: 0,
});

const createInitialState = (): DashboardOverviewState => ({
  metrics: createInitialMetrics(),
  evaluations: [],
  classSummaries: [],
  nextEvaluation: null,
  pendingEvaluations: [],
  evaluationConfigs: [],
  studentStatus: { active: 0, inactive: 0, total: 0 },
  capacityAlerts: [],
});

type MockSnapshot = ReturnType<typeof mockServer.snapshot>;

type ClassDictionary = Record<string, ClassRoom>;
type StudentDictionary = Record<string, Student[]>;

const buildClassDictionary = (classes: ClassRoom[]): ClassDictionary => {
  return classes.reduce<ClassDictionary>((acc, classRoom) => {
    acc[classRoom.id] = classRoom;
    return acc;
  }, {});
};

const buildStudentDictionary = (students: Student[]): StudentDictionary => {
  return students.reduce<StudentDictionary>((acc, student) => {
    if (!student.classId) {
      return acc;
    }

    if (!acc[student.classId]) {
      acc[student.classId] = [];
    }

    acc[student.classId].push(student);
    return acc;
  }, {});
};

const buildEvaluations = (
  upcomingEvaluations: UpcomingEvaluation[],
  classesById: ClassDictionary,
): DashboardEvaluation[] => {
  return upcomingEvaluations
    .map((evaluation) => {
      const classRoom = classesById[evaluation.classId];

      return {
        id: evaluation.id,
        title: evaluation.title,
        classId: evaluation.classId,
        className: classRoom?.name ?? 'Turma desconhecida',
        scheduledAt: new Date(evaluation.scheduledAt),
      };
    })
    .sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());
};

const buildClassSummaries = (
  classes: ClassRoom[],
  studentsByClass: StudentDictionary,
): ClassSummary[] => {
  return classes.map((classRoom) => {
    const classStudents = studentsByClass[classRoom.id] ?? [];
    const activeCount = classStudents.filter((student) => student.status === 'active').length;
    const inactiveCount = classStudents.length - activeCount;
    const totalStudents = classStudents.length;
    const occupancyPercent =
      classRoom.capacity > 0
        ? Math.min(100, Math.round((totalStudents / classRoom.capacity) * 100))
        : 0;

    return {
      id: classRoom.id,
      name: classRoom.name,
      capacity: classRoom.capacity,
      totalStudents,
      activeCount,
      inactiveCount,
      occupancyPercent,
    };
  });
};

const buildEvaluationConfigSummaries = (
  evaluationConfigs: EvaluationConfig[],
  classesById: ClassDictionary,
): EvaluationConfigSummary[] => {
  return evaluationConfigs
    .map((config) => {
      const classRoom = classesById[config.classId];
      const totalWeight = config.criteria.reduce((total, criterion) => total + criterion.weight, 0);

      return {
        id: config.classId,
        className: classRoom?.name ?? 'Turma desconhecida',
        criteriaCount: config.criteria.length,
        totalWeight,
        isWeightBalanced: totalWeight === 100,
        updatedAt: new Date(config.updatedAt),
      } satisfies EvaluationConfigSummary;
    })
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
};

const buildStudentStatusSummary = (students: Student[]): StudentStatusSummary => {
  const summary = students.reduce(
    (acc, student) => {
      if (student.status === 'active') {
        acc.active += 1;
      } else {
        acc.inactive += 1;
      }
      return acc;
    },
    { active: 0, inactive: 0 },
  );

  return {
    ...summary,
    total: summary.active + summary.inactive,
  } satisfies StudentStatusSummary;
};

const buildCapacityAlerts = (summaries: ClassSummary[]): CapacityAlert[] => {
  return summaries
    .filter((summary) => summary.capacity > 0 && summary.occupancyPercent >= 80)
    .sort((a, b) => b.occupancyPercent - a.occupancyPercent)
    .map((summary) => ({
      id: summary.id,
      name: summary.name,
      occupancyPercent: summary.occupancyPercent,
      capacity: summary.capacity,
      totalStudents: summary.totalStudents,
    } satisfies CapacityAlert));
};

export const useDashboardOverview = (): DashboardOverviewState & { isLoading: boolean } => {
  const [snapshot, setSnapshot] = useState<MockSnapshot | null>(null);

  useEffect(() => {
    const nextSnapshot = mockServer.snapshot();
    setSnapshot(nextSnapshot);
  }, []);

  const state = useMemo(() => {
    if (!snapshot) {
      return createInitialState();
    }

    const classesById = buildClassDictionary(snapshot.classes);
    const studentsByClass = buildStudentDictionary(snapshot.students);
    const evaluations = buildEvaluations(snapshot.upcomingEvaluations, classesById);
  const classSummaries = buildClassSummaries(snapshot.classes, studentsByClass);
  const evaluationConfigs = buildEvaluationConfigSummaries(snapshot.evaluationConfigs, classesById);
  const studentStatus = buildStudentStatusSummary(snapshot.students);
  const capacityAlerts = buildCapacityAlerts(classSummaries);
  const activeStudentsCount = studentStatus.active;
    const classesWithUpcomingEvaluation = new Set(evaluations.map((evaluation) => evaluation.classId));
    const pendingEvaluations = snapshot.classes
      .filter((classRoom) => !classesWithUpcomingEvaluation.has(classRoom.id))
      .map((classRoom) => {
        const classStudents = studentsByClass[classRoom.id] ?? [];

        return {
          id: classRoom.id,
          name: classRoom.name,
          studentCount: classStudents.length,
          lastUpdatedAt: new Date(classRoom.updatedAt),
        } satisfies PendingEvaluationReminder;
      })
      .sort((a, b) => b.studentCount - a.studentCount);

    return {
      metrics: {
        students: snapshot.students.length,
        classes: snapshot.classes.length,
        activeStudents: activeStudentsCount,
      },
      evaluations,
      classSummaries,
      nextEvaluation: evaluations[0] ?? null,
      pendingEvaluations,
      evaluationConfigs,
      studentStatus,
      capacityAlerts,
    } satisfies DashboardOverviewState;
  }, [snapshot]);

  return {
    ...state,
    isLoading: snapshot === null,
  };
};
