export const sleep = async (ms: number): Promise<void> =>
  new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });

export const pollUntil = async <T>(
  fetcher: () => Promise<T>,
  isDone: (value: T) => boolean,
  options: {
    intervalMs?: number;
    maxPolls?: number;
  } = {}
): Promise<T> => {
  const intervalMs = options.intervalMs ?? 3000;
  const maxPolls = options.maxPolls ?? 120;

  let latest = await fetcher();
  for (let i = 0; i < maxPolls; i += 1) {
    if (isDone(latest)) {
      return latest;
    }
    await sleep(intervalMs);
    latest = await fetcher();
  }

  return latest;
};
