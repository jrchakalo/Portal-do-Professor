import type { AxiosError } from 'axios';

import type {
  EvaluationConfig,
  UpcomingEvaluation,
  UpdateEvaluationConfigInput,
} from '../types';
import { httpClient } from './httpClient';

export interface EvaluationServiceError {
  message: string;
  cause?: AxiosError;
}

const mapError = (error: unknown): EvaluationServiceError => {
  if (error && typeof error === 'object' && 'isAxiosError' in error) {
    const axiosError = error as AxiosError<{ message?: string }>;
    return {
      message:
        axiosError.response?.data?.message ?? 'Erro ao comunicar com o serviço de avaliações.',
      cause: axiosError,
    };
  }

  return {
    message: 'Erro inesperado ao comunicar com o serviço de avaliações.',
  };
};

export const evaluationService = {
  async listConfigs(): Promise<EvaluationConfig[]> {
    try {
      const response = await httpClient.get<EvaluationConfig[]>('/evaluations/configs');
      return response.data;
    } catch (error) {
      throw mapError(error);
    }
  },

  async getConfig(classId: string): Promise<EvaluationConfig> {
    try {
      const response = await httpClient.get<EvaluationConfig>(`/evaluations/configs/${classId}`);
      return response.data;
    } catch (error) {
      throw mapError(error);
    }
  },

  async updateConfig(
    classId: string,
    payload: UpdateEvaluationConfigInput,
  ): Promise<EvaluationConfig> {
    try {
      const response = await httpClient.put<EvaluationConfig>(
        `/evaluations/configs/${classId}`,
        payload,
      );
      return response.data;
    } catch (error) {
      throw mapError(error);
    }
  },

  async listUpcoming(): Promise<UpcomingEvaluation[]> {
    try {
      const response = await httpClient.get<UpcomingEvaluation[]>('/evaluations/upcoming');
      return response.data;
    } catch (error) {
      throw mapError(error);
    }
  },
};
