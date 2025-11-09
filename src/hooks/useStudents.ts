import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { ClassRoom, Student } from '../types';
import type { CreateStudentInput, UpdateStudentInput } from '../types/student';
import { classService } from '../services/classService';
import { studentService } from '../services/studentService';

interface StudentsError {
  message: string;
  cause?: unknown;
}

interface UseStudentsState {
  students: Student[];
  classes: ClassRoom[];
  isLoading: boolean;
  isMutating: boolean;
  error: StudentsError | null;
  refresh: () => Promise<void>;
  createStudent: (input: CreateStudentInput) => Promise<Student>;
  updateStudent: (id: string, changes: UpdateStudentInput) => Promise<Student>;
  deleteStudent: (id: string) => Promise<void>;
  resetError: () => void;
}

const toStudentsError = (error: unknown): StudentsError => {
  if (error && typeof error === 'object' && 'message' in error) {
    return {
      message: String((error as { message?: string }).message ?? 'Erro ao processar operação.'),
      cause: error,
    };
  }

  return {
    message: 'Erro inesperado ao processar operação com alunos.',
    cause: error,
  };
};

export const useStudents = (): UseStudentsState => {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [isMutating, setMutating] = useState(false);
  const [error, setError] = useState<StudentsError | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;

    const load = async (): Promise<void> => {
      setLoading(true);
      try {
        const [studentsResponse, classesResponse] = await Promise.all([
          studentService.list(),
          classService.list(),
        ]);

        if (!isMounted.current) {
          return;
        }

        setStudents(studentsResponse);
        setClasses(classesResponse);
        setError(null);
      } catch (loadError) {
        if (!isMounted.current) {
          return;
        }
        setError(toStudentsError(loadError));
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      isMounted.current = false;
    };
  }, []);

  const resetError = useCallback((): void => {
    setError(null);
  }, []);

  const wrapMutation = useCallback(
    async <T>(operation: () => Promise<T>): Promise<T> => {
      setMutating(true);
      try {
        const result = await operation();
        setError(null);
        return result;
      } catch (mutationError) {
        const formatted = toStudentsError(mutationError);
        setError(formatted);
        throw formatted;
      } finally {
        setMutating(false);
      }
    },
    [],
  );

  const refresh = useCallback(async (): Promise<void> => {
    try {
      const [studentsResponse, classesResponse] = await Promise.all([
        studentService.list(),
        classService.list(),
      ]);

      if (!isMounted.current) {
        return;
      }

      setStudents(studentsResponse);
      setClasses(classesResponse);
      setError(null);
    } catch (refreshError) {
      if (!isMounted.current) {
        return;
      }
      const formatted = toStudentsError(refreshError);
      setError(formatted);
      throw formatted;
    }
  }, []);

  const createStudent = useCallback(
    async (input: CreateStudentInput): Promise<Student> => {
      return wrapMutation(async () => {
        const created = await studentService.create(input);
        setStudents((prev) => [...prev, created]);
        if (created.classId) {
          void refresh().catch(() => undefined);
        }
        return created;
      });
    }, [refresh, wrapMutation]);

  const updateStudent = useCallback(
    async (id: string, changes: UpdateStudentInput): Promise<Student> => {
      return wrapMutation(async () => {
        const updated = await studentService.update(id, changes);
        setStudents((prev) => prev.map((student) => (student.id === id ? updated : student)));
        if ('classId' in changes) {
          void refresh().catch(() => undefined);
        }
        return updated;
      });
    }, [refresh, wrapMutation]);

  const deleteStudent = useCallback(
    async (id: string): Promise<void> => {
      await wrapMutation(async () => {
        await studentService.remove(id);
        setStudents((prev) => prev.filter((student) => student.id !== id));
      });
    }, [wrapMutation]);

  return useMemo(
    () => ({
      students,
      classes,
      isLoading,
      isMutating,
      error,
      refresh,
      createStudent,
      updateStudent,
      deleteStudent,
      resetError,
    }),
    [classes, createStudent, deleteStudent, error, isLoading, isMutating, refresh, students, updateStudent, resetError],
  );
};
