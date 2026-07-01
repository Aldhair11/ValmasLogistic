import { sileo } from 'sileo';
import { extractErrorMessage } from './errors';

export function notifySuccess(title: string, description?: string): void {
  sileo.success({
    title,
    ...(description ? { description } : {}),
  });
}

export function notifyError(
  error: unknown,
  fallback: string,
  title = 'Error',
): void {
  sileo.error({
    title,
    description: extractErrorMessage(error, fallback),
  });
}

export function notifyInfo(title: string, description?: string): void {
  sileo.info({
    title,
    ...(description ? { description } : {}),
  });
}
