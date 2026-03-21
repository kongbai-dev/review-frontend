export const formatDateTime = (iso: string | undefined): string => {
  if (!iso) {
    return '-';
  }
  return new Date(iso).toLocaleString();
};
