import { router } from '@/app/router';

export const goLogin = async (): Promise<void> => {
  await router.push('/login');
};
