import { useEffect, useMemo, useState } from 'react';

import { mockServer } from '../services/mockServer';
import type { ClassRoom, Student, UpcomingEvaluation } from '../types';

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

interface DashboardOverviewState {
  metrics: OverviewMetrics;
  evaluations: DashboardEvaluation[];
  classSummaries: ClassSummary[];
  nextEvaluation: DashboardEvaluation | null;
  pendingEvaluations: PendingEvaluationReminder[];
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
    const activeStudentsCount = snapshot.students.filter((student) => student.status === 'active').length;
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
    } satisfies DashboardOverviewState;
  }, [snapshot]);

  return {
    ...state,
    isLoading: snapshot === null,
  };
};
