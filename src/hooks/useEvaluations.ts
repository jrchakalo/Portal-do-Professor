import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type {
  ClassRoom,
  EvaluationConfig,
  UpcomingEvaluation,
  UpdateEvaluationConfigInput,
} from '../types';
import { classService } from '../services/classService';
import { evaluationService } from '../services/evaluationService';

interface EvaluationsError {
  message: string;
  cause?: unknown;
}

interface UseEvaluationsState {
  classes: ClassRoom[];
  configs: Record<string, EvaluationConfig>;
  upcomingEvaluations: UpcomingEvaluation[];
  isLoading: boolean;
  isMutating: boolean;
  error: EvaluationsError | null;
  refresh: () => Promise<void>;
  updateConfig: (classId: string, payload: UpdateEvaluationConfigInput) => Promise<EvaluationConfig>;
  resetError: () => void;
}

const toEvaluationsError = (error: unknown): EvaluationsError => {
  if (error && typeof error === 'object' && 'message' in error) {
    return {
      message: String((error as { message?: string }).message ?? 'Erro ao processar avaliação.'),
      cause: error,
    };
  }

  return {
    message: 'Erro inesperado ao processar avaliações.',
    cause: error,
  };
};

const createConfigsMap = (configs: EvaluationConfig[]): Record<string, EvaluationConfig> => {
  return configs.reduce<Record<string, EvaluationConfig>>((acc, config) => {
    acc[config.classId] = config;
    return acc;
  }, {});
};

const sortUpcoming = (upcoming: UpcomingEvaluation[]): UpcomingEvaluation[] => {
  return [...upcoming].sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
};

export const useEvaluations = (): UseEvaluationsState => {
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [configs, setConfigs] = useState<Record<string, EvaluationConfig>>({});
  const [upcomingEvaluations, setUpcomingEvaluations] = useState<UpcomingEvaluation[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [isMutating, setMutating] = useState(false);
  const [error, setError] = useState<EvaluationsError | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;

    const load = async (): Promise<void> => {
      setLoading(true);
      try {
        const [classResponse, configsResponse, upcomingResponse] = await Promise.all([
          classService.list(),
          evaluationService.listConfigs(),
          evaluationService.listUpcoming(),
        ]);

        if (!isMounted.current) {
          return;
        }

        setClasses(classResponse);
        setConfigs(createConfigsMap(configsResponse));
        setUpcomingEvaluations(sortUpcoming(upcomingResponse));
        setError(null);
      } catch (loadError) {
        if (!isMounted.current) {
          return;
        }
        setError(toEvaluationsError(loadError));
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
        const formatted = toEvaluationsError(mutationError);
        setError(formatted);
        throw formatted;
      } finally {
        setMutating(false);
      }
    },
  []);

  const refresh = useCallback(async (): Promise<void> => {
    try {
      const [classResponse, configsResponse, upcomingResponse] = await Promise.all([
        classService.list(),
        evaluationService.listConfigs(),
        evaluationService.listUpcoming(),
      ]);

      if (!isMounted.current) {
        return;
      }

      setClasses(classResponse);
      setConfigs(createConfigsMap(configsResponse));
      setUpcomingEvaluations(sortUpcoming(upcomingResponse));
      setError(null);
    } catch (refreshError) {
      if (!isMounted.current) {
        return;
      }
      const formatted = toEvaluationsError(refreshError);
      setError(formatted);
      throw formatted;
    }
  }, []);

  const updateConfig = useCallback(
    async (classId: string, payload: UpdateEvaluationConfigInput): Promise<EvaluationConfig> => {
      return wrapMutation(async () => {
        const updated = await evaluationService.updateConfig(classId, payload);
        setConfigs((prev) => ({ ...prev, [classId]: updated }));
        return updated;
      });
    },
  [wrapMutation]);

  return useMemo(
    () => ({
      classes,
      configs,
      upcomingEvaluations,
      isLoading,
      isMutating,
      error,
      refresh,
      updateConfig,
      resetError,
    }),
    [classes, configs, error, isLoading, isMutating, refresh, upcomingEvaluations, updateConfig, resetError],
  );
};
