<template>
  <section class="space-y-6">
    <header>
      <h2 class="text-2xl font-semibold">登录审核系统</h2>
      <p class="text-muted mt-2 text-sm">当前为前端骨架，默认走 Mock 鉴权流程。</p>
    </header>

    <form class="space-y-4" @submit.prevent="onSubmit">
      <label class="block text-sm">
        用户名
        <input v-model="form.username" data-testid="login-username" class="form-control mt-1" />
      </label>

      <label class="block text-sm">
        密码
        <input
          v-model="form.password"
          data-testid="login-password"
          type="password"
          class="form-control mt-1"
        />
      </label>

      <label class="block text-sm">
        角色
        <select v-model="form.role" data-testid="login-role" class="form-control mt-1">
          <option value="reviewer">审核员</option>
          <option value="admin">管理员</option>
          <option value="viewer">观察员</option>
        </select>
      </label>

      <button type="submit" data-testid="login-submit" class="btn btn-primary w-full">
        进入系统
      </button>

      <p v-if="error" class="text-sm text-[var(--color-danger)]">{{ error }}</p>
    </form>
  </section>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';
import type { LoginPayload } from '@/types/domain';

const router = useRouter();
const authStore = useAuthStore();
const error = ref('');

const form = reactive<LoginPayload>({
  username: 'reviewer-01',
  password: '123456',
  role: 'reviewer'
});

const onSubmit = async (): Promise<void> => {
  error.value = '';
  try {
    await authStore.login(form);
    await router.push('/reviews');
  } catch (err) {
    error.value = (err as Error).message;
  }
};
</script>
