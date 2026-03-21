<template>
  <section class="space-y-5">
    <header>
      <h2 class="text-xl font-semibold">登录审核系统</h2>
      <p class="mt-1 text-sm text-slate-300">当前为前端骨架，默认走 Mock 鉴权流程。</p>
    </header>

    <form class="space-y-4" @submit.prevent="onSubmit">
      <label class="block text-sm">
        用户名
        <input v-model="form.username" class="mt-1 w-full rounded-md border border-white/15 bg-transparent px-3 py-2" />
      </label>

      <label class="block text-sm">
        密码
        <input
          v-model="form.password"
          type="password"
          class="mt-1 w-full rounded-md border border-white/15 bg-transparent px-3 py-2"
        />
      </label>

      <label class="block text-sm">
        角色
        <select v-model="form.role" class="mt-1 w-full rounded-md border border-white/15 bg-[var(--color-surface)] px-3 py-2">
          <option value="reviewer">审核员</option>
          <option value="admin">管理员</option>
          <option value="viewer">观察员</option>
        </select>
      </label>

      <button type="submit" class="w-full rounded-md bg-emerald-500 px-3 py-2 text-sm font-semibold text-black hover:bg-emerald-400">
        进入系统
      </button>

      <p v-if="error" class="text-sm text-rose-300">{{ error }}</p>
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
