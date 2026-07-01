import axios from 'axios';
import type { ProblemDetails } from '../types';


export function extractErrorMessage(
  error: unknown,
  fallback = 'Ocurrió un error inesperado. Inténtalo de nuevo.',
): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ProblemDetails | undefined;
    if (data?.detail) return data.detail;
    if (data?.title) return data.title;
    if (error.message) return error.message;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
