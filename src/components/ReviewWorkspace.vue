<script setup lang="ts">
import { ref, watch } from 'vue';

// 1. 定义极其严格的 TypeScript 接口
interface QAData {
  id: string;
  question: string;
  answer: string;
  topics: string[];
  scenes: string[];
  confidence: number;
}

interface ContextData {
  fragment_id: string;
  content: string;
  source_path: string;
  page: number;
}

// 2. 定义 Props
const props = defineProps<{
  initialQaData: QAData;
  contextData: ContextData;
}>();

// 3. 定义触发给父组件的事件
const emit = defineEmits<{
  (e: 'approve', data: QAData & { status: string }): void;
  (e: 'reject', id: string): void;
}>();

// 4. 创建本地响应式表单状态，拷贝自 props
const formData = ref<QAData>({ ...props.initialQaData });

// 监听 props 变化（比如父组件切换到了下一道题），同步更新本地表单
watch(
  () => props.initialQaData,
  (newData) => {
    formData.value = { ...newData };
  },
  { deep: true }
);

// 预定义选项
const topicOptions = ["半导体物理", "半导体材料", "半导体器件", "工艺技术", "计算物理"];
const sceneOptions = ["engineer", "researcher", "student", "support"];

// 提交处理函数
const handleApprove = () => {
  emit('approve', { ...formData.value, status: 'reviewed' });
};

const handleReject = () => {
  emit('reject', formData.value.id);
};
</script>

<template>
  <div class="flex h-[calc(100vh-64px)] w-full bg-slate-50 text-slate-800">
    
    <div class="flex flex-col w-1/2 border-r border-slate-200 bg-white">
      <div class="p-4 border-b border-slate-100 bg-slate-50">
        <h2 class="text-lg font-semibold text-slate-700 flex items-center">
          <svg class="w-5 h-5 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
          参考原文
        </h2>
        <div class="text-sm text-slate-500 mt-1">
          来源: <span class="font-medium">{{ contextData.source_path }}</span> (第 {{ contextData.page }} 页)
        </div>
      </div>
      
      <div class="flex-1 p-6 overflow-y-auto">
        <div class="bg-indigo-50/50 p-5 rounded-lg border border-indigo-100 text-slate-700 leading-relaxed text-base tracking-wide whitespace-pre-wrap">
          {{ contextData.content }}
        </div>
      </div>
    </div>

    <div class="flex flex-col w-1/2 bg-white">
      <div class="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
        <h2 class="text-lg font-semibold text-slate-700 flex items-center">
          <svg class="w-5 h-5 mr-2 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
          问答对审核
        </h2>
        <span class="px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">待审核</span>
      </div>

      <div class="flex-1 p-6 overflow-y-auto space-y-6">
        
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-2">问题 (Question)</label>
          <input 
            type="text" 
            v-model="formData.question" 
            class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-2">答案 (Answer)</label>
          <textarea 
            v-model="formData.answer" 
            rows="6"
            class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow resize-y"
          ></textarea>
        </div>

        <div class="grid grid-cols-2 gap-6">
          <div class="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <label class="block text-sm font-medium text-slate-700 mb-3">主题分类 (Topics)</label>
            <div class="flex flex-wrap gap-2">
              <label v-for="topic in topicOptions" :key="topic" class="inline-flex items-center cursor-pointer">
                <input type="checkbox" v-model="formData.topics" :value="topic" class="hidden peer" />
                <span class="px-3 py-1.5 text-sm rounded-md border border-slate-300 text-slate-600 peer-checked:bg-indigo-600 peer-checked:text-white peer-checked:border-indigo-600 transition-colors">
                  {{ topic }}
                </span>
              </label>
            </div>
          </div>

          <div class="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <label class="block text-sm font-medium text-slate-700 mb-3">适用场景 (Scenes)</label>
            <div class="flex flex-wrap gap-2">
              <label v-for="scene in sceneOptions" :key="scene" class="inline-flex items-center cursor-pointer">
                <input type="checkbox" v-model="formData.scenes" :value="scene" class="hidden peer" />
                <span class="px-3 py-1.5 text-sm rounded-md border border-slate-300 text-slate-600 peer-checked:bg-emerald-600 peer-checked:text-white peer-checked:border-emerald-600 transition-colors">
                  {{ scene }}
                </span>
              </label>
            </div>
          </div>
        </div>

        <div>
          <div class="flex justify-between items-center mb-2">
            <label class="block text-sm font-medium text-slate-700">AI 置信度 (Confidence)</label>
            <span class="text-sm font-bold text-indigo-600">{{ Number(formData.confidence).toFixed(2) }}</span>
          </div>
          <input 
            type="range" 
            v-model.number="formData.confidence" 
            min="0.5" max="1.0" step="0.05" 
            class="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
        </div>
      </div>

      <div class="p-4 border-t border-slate-200 bg-white flex justify-end space-x-4">
        <button 
          @click="handleReject"
          class="px-6 py-2.5 bg-white border border-rose-300 text-rose-600 hover:bg-rose-50 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"
        >
          打回 / 废弃
        </button>
        <button 
          @click="handleApprove"
          class="px-6 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 font-medium rounded-lg transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 flex items-center"
        >
          <svg class="w-5 h-5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
          审核通过并入库
        </button>
      </div>
    </div>
  </div>
</template>