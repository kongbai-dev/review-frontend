export const normalizeError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return '未知错误';
};
