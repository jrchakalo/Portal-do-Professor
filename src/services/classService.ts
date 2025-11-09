import type { AxiosError } from 'axios';

import type { ClassRoom } from '../types';
import { httpClient } from './httpClient';

export interface ClassServiceError {
  message: string;
  cause?: AxiosError;
}

const mapError = (error: unknown): ClassServiceError => {
  if (error && typeof error === 'object' && 'isAxiosError' in error) {
    const axiosError = error as AxiosError<{ message?: string }>;
    return {
      message: axiosError.response?.data?.message ?? 'Erro ao comunicar com o serviço de turmas.',
      cause: axiosError,
    };
  }

  return {
    message: 'Erro inesperado ao comunicar com o serviço de turmas.',
  };
};

export const classService = {
  async list(): Promise<ClassRoom[]> {
    try {
      const response = await httpClient.get<ClassRoom[]>('/classes');
      return response.data;
    } catch (error) {
      throw mapError(error);
    }
  },
};
