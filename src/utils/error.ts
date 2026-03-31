import { isAxiosError } from 'axios';

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const normalizeError = (error: unknown): string => {
  if (isAxiosError(error)) {
    const status = error.response?.status;
    const data = error.response?.data;

    if (isObject(data)) {
      const detail = data.detail;

      if (typeof detail === 'string' && detail.trim()) {
        return detail;
      }

      if (isObject(detail)) {
        if (typeof detail.message === 'string' && detail.message.trim()) {
          const currentVersion = detail.current_version;
          if (typeof currentVersion === 'number') {
            return `${detail.message} (current_version=${currentVersion})`;
          }
          return detail.message;
        }
      }

      if (typeof data.message === 'string' && data.message.trim()) {
        return data.message;
      }
    }

    if (status === 401) {
      return 'Authentication expired. Please log in again.';
    }
    if (status === 403) {
      return 'Permission denied for this operation.';
    }
    if (status === 404) {
      return 'Requested resource was not found.';
    }
    if (status === 409) {
      return 'Version conflict detected. Please refresh and retry.';
    }
    if (status === 501) {
      return 'Backend has not implemented this endpoint yet (501).';
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return 'Unknown error';
};
