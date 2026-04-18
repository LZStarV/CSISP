<template>
  <div class="demo-component">
    <AButton type="primary" @click="handleFetchDemo">获取 Demo 信息</AButton>
    <ACard v-if="demoInfo" title="Demo 信息" class="demo-card">
      <ADescriptions bordered>
        <ADescriptionsItem
          v-for="(value, key) in demoInfoItems"
          :key="key"
          :label="key"
        >
          {{ value }}
        </ADescriptionsItem>
      </ADescriptions>
    </ACard>
    <ASpin v-if="loading" :spinning="loading" class="loading-wrapper">
      <div class="loading-content" />
    </ASpin>
  </div>
</template>

<script setup lang="ts">
import type { GetDemoInfoResult } from '@csisp/contracts';
import { message } from 'ant-design-vue';
import { computed, ref } from 'vue';

import { portalDemoCall } from '@/api/portal/demo';

const loading = ref(false);
const demoInfo = ref<GetDemoInfoResult['demoInfo'] | null>(null);

const demoInfoItems = computed(() => {
  if (!demoInfo.value) return {};
  return {
    'Demo ID': demoInfo.value.demoId,
    标题: demoInfo.value.title,
    描述: demoInfo.value.description,
    创建时间: formatTime(demoInfo.value.createTime),
  };
});

const formatTime = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString('zh-CN');
};

const handleFetchDemo = async () => {
  loading.value = true;
  try {
    const res = await portalDemoCall<GetDemoInfoResult>('get-demo-info', {
      demoId: 'test-001',
      withExtra: false,
    });
    demoInfo.value = res.demoInfo ?? null;
  } catch {
    message.error('获取 Demo 信息失败，请稍后重试');
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.demo-component {
  padding: 20px;
}

.demo-card {
  margin-top: 16px;
}

.loading-wrapper {
  position: fixed;
  inset: 0;
  background-color: rgb(0 0 0 / 30%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.loading-content {
  width: 100px;
  height: 100px;
}
</style>
