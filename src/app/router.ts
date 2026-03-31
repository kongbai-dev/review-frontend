import { createRouter, createWebHashHistory } from 'vue-router';
import { pinia } from '@/app/pinia';
import { useAuthStore } from '@/stores/auth.store';
import type { UserRole } from '@/types/domain';

const routes = [
  {
    path: '/login',
    component: () => import('@/layouts/AuthLayout.vue'),
    children: [{ path: '', name: 'login', component: () => import('@/pages/LoginPage.vue') }]
  },
  {
    path: '/',
    component: () => import('@/layouts/AppLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: '/reviews' },
      {
        path: 'reviews',
        name: 'reviews',
        component: () => import('@/pages/ReviewQueuePage.vue'),
        meta: { roles: ['admin', 'reviewer', 'observer'] as UserRole[] }
      },
      {
        path: 'reviews/:id',
        name: 'review-detail',
        component: () => import('@/pages/ReviewDetailPage.vue'),
        meta: { roles: ['admin', 'reviewer', 'observer'] as UserRole[] }
      },
      {
        path: 'dashboard',
        name: 'dashboard',
        component: () => import('@/pages/DashboardPage.vue'),
        meta: { roles: ['admin', 'reviewer', 'observer'] as UserRole[] }
      },
      {
        path: 'documents',
        name: 'documents',
        component: () => import('@/pages/DocumentManagePage.vue'),
        meta: { roles: ['admin', 'reviewer', 'observer'] as UserRole[] }
      },
      {
        path: 'members',
        name: 'members',
        component: () => import('@/pages/MemberRankingPage.vue'),
        meta: { roles: ['admin', 'reviewer', 'observer'] as UserRole[] }
      },
      {
        path: 'history',
        name: 'history',
        component: () => import('@/pages/HistoryPage.vue'),
        meta: { roles: ['admin', 'reviewer', 'observer'] as UserRole[] }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/pages/NotFoundPage.vue')
  }
];

export const router = createRouter({
  history: createWebHashHistory(),
  routes
});

router.beforeEach(async (to) => {
  const authStore = useAuthStore(pinia);
  await authStore.ensureSession();

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return { name: 'login' };
  }

  const allowedRoles = to.meta.roles as UserRole[] | undefined;
  if (allowedRoles && !allowedRoles.includes(authStore.role)) {
    return { name: 'reviews' };
  }

  if (to.name === 'login' && authStore.isAuthenticated) {
    return { name: 'reviews' };
  }

  return true;
});

