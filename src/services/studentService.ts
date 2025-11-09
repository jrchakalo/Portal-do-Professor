import type { AxiosError } from 'axios';

import type { Student } from '../types';
import type { CreateStudentInput, UpdateStudentInput } from '../types/student';
import { httpClient } from './httpClient';

export interface StudentServiceError {
  message: string;
  cause?: AxiosError;
}

const mapError = (error: unknown): StudentServiceError => {
  if (error && typeof error === 'object' && 'isAxiosError' in error) {
    const axiosError = error as AxiosError<{ message?: string }>;
    return {
      message: axiosError.response?.data?.message ?? 'Erro ao comunicar com o serviço de alunos.',
      cause: axiosError,
    };
  }

  return {
    message: 'Erro inesperado ao comunicar com o serviço de alunos.',
  };
};

export const studentService = {
  async list(): Promise<Student[]> {
    try {
      const response = await httpClient.get<Student[]>('/students');
      return response.data;
    } catch (error) {
      throw mapError(error);
    }
  },

  async create(payload: CreateStudentInput): Promise<Student> {
    try {
      const response = await httpClient.post<Student>('/students', payload);
      return response.data;
    } catch (error) {
      throw mapError(error);
    }
  },

  async update(id: string, payload: UpdateStudentInput): Promise<Student> {
    try {
      const response = await httpClient.put<Student>(`/students/${id}`, payload);
      return response.data;
    } catch (error) {
      throw mapError(error);
    }
  },

  async remove(id: string): Promise<void> {
    try {
      await httpClient.delete(`/students/${id}`);
    } catch (error) {
      throw mapError(error);
    }
  },
};
