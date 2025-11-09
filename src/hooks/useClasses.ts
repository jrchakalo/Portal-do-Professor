import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { ClassRoom } from '../types';
import type { CreateClassInput, UpdateClassInput } from '../types/class';
import { classService } from '../services/classService';

interface ClassesError {
  message: string;
  cause?: unknown;
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
  error: ClassesError | null;
  summary: ClassesSummary;
  refresh: () => Promise<void>;
  createClass: (input: CreateClassInput) => Promise<ClassRoom>;
  updateClass: (id: string, changes: UpdateClassInput) => Promise<ClassRoom>;
  deleteClass: (id: string) => Promise<void>;
  resetError: () => void;
}

const toClassesError = (error: unknown): ClassesError => {
  if (error && typeof error === 'object' && 'message' in error) {
    return {
      message: String((error as { message?: string }).message ?? 'Erro ao processar operação com turmas.'),
      cause: error,
    };
  }

  return {
    message: 'Erro inesperado ao processar operação com turmas.',
    cause: error,
  };
};

const createSummary = (classes: ClassRoom[]): ClassesSummary => {
  const totalClasses = classes.length;
  let filledClasses = 0;
  let classesWithVacancies = 0;
  let totalCapacity = 0;
  let totalEnrolled = 0;

  classes.forEach((classRoom) => {
    const enrolled = classRoom.studentIds.length;
    totalCapacity += classRoom.capacity;
    totalEnrolled += enrolled;
    if (enrolled >= classRoom.capacity) {
      filledClasses += 1;
    } else {
      classesWithVacancies += 1;
    }
  });

  const occupancyRate = totalCapacity > 0 ? totalEnrolled / totalCapacity : 0;

  return {
    totalClasses,
    filledClasses,
    classesWithVacancies,
    totalCapacity,
    totalEnrolled,
    occupancyRate,
  };
};

export const useClasses = (): UseClassesState => {
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [isMutating, setMutating] = useState(false);
  const [error, setError] = useState<ClassesError | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;

    const load = async (): Promise<void> => {
      setLoading(true);
      try {
        const response = await classService.list();
        if (!isMounted.current) {
          return;
        }
        setClasses(response);
        setError(null);
      } catch (loadError) {
        if (!isMounted.current) {
          return;
        }
        setError(toClassesError(loadError));
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
        const formatted = toClassesError(mutationError);
        setError(formatted);
        throw formatted;
      } finally {
        setMutating(false);
      }
    },
  []);

  const refresh = useCallback(async (): Promise<void> => {
    try {
      const response = await classService.list();
      if (!isMounted.current) {
        return;
      }
      setClasses(response);
      setError(null);
    } catch (refreshError) {
      if (!isMounted.current) {
        return;
      }
      const formatted = toClassesError(refreshError);
      setError(formatted);
      throw formatted;
    }
  }, []);

  const createClass = useCallback(
    async (input: CreateClassInput): Promise<ClassRoom> => {
      return wrapMutation(async () => {
        const created = await classService.create(input);
        setClasses((prev) => [...prev, created]);
        return created;
      });
    },
  [wrapMutation]);

  const updateClass = useCallback(
    async (id: string, changes: UpdateClassInput): Promise<ClassRoom> => {
      return wrapMutation(async () => {
        const updated = await classService.update(id, changes);
        setClasses((prev) => prev.map((classRoom) => (classRoom.id === id ? updated : classRoom)));
        return updated;
      });
    },
  [wrapMutation]);

  const deleteClass = useCallback(
    async (id: string): Promise<void> => {
      await wrapMutation(async () => {
        await classService.remove(id);
        setClasses((prev) => prev.filter((classRoom) => classRoom.id !== id));
      });
    },
  [wrapMutation]);

  const summary = useMemo(() => createSummary(classes), [classes]);

  return useMemo(
    () => ({
      classes,
      isLoading,
      isMutating,
      error,
      summary,
      refresh,
      createClass,
      updateClass,
      deleteClass,
      resetError,
    }),
    [classes, createClass, deleteClass, error, isLoading, isMutating, refresh, summary, updateClass, resetError],
  );
};
