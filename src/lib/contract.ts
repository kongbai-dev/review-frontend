export const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const expectString = (value: unknown, path: string): string => {
  if (typeof value !== 'string') {
    throw new Error(`Contract mismatch: ${path} must be string`);
  }
  return value;
};

export const expectOptionalString = (value: unknown, path: string): string | undefined => {
  if (value === undefined || value === null) {
    return undefined;
  }
  return expectString(value, path);
};

export const expectNumber = (value: unknown, path: string): number => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new Error(`Contract mismatch: ${path} must be number`);
  }
  return value;
};

export const expectOptionalNumber = (value: unknown, path: string): number | undefined => {
  if (value === undefined || value === null) {
    return undefined;
  }
  return expectNumber(value, path);
};

export const expectStringArray = (value: unknown, path: string): string[] => {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    throw new Error(`Contract mismatch: ${path} must be string[]`);
  }
  return value;
};
