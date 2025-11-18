<template>
  <n-card class="page-container" :bordered="false">
    <!-- 页面头部 -->
    <template #header v-if="showHeader">
      <div class="page-header">
        <div class="page-title">
          <h1>{{ title }}</h1>
          <p v-if="description" class="page-description">{{ description }}</p>
        </div>
        <div class="page-actions">
          <slot name="actions" />
        </div>
      </div>
    </template>

    <!-- 面包屑导航 -->
    <div v-if="breadcrumbs && breadcrumbs.length > 0" class="page-breadcrumb">
      <n-breadcrumb>
        <n-breadcrumb-item
          v-for="item in breadcrumbs"
          :key="item.label"
          :clickable="!!item.path"
          @click="handleBreadcrumbClick(item)"
        >
          {{ item.label }}
        </n-breadcrumb-item>
      </n-breadcrumb>
    </div>

    <!-- 页面内容 -->
    <div class="page-content">
      <slot />
    </div>

    <!-- 页面底部 -->
    <template #footer v-if="$slots.footer">
      <slot name="footer" />
    </template>
  </n-card>
</template>

<script setup lang="ts">
import { NCard, NBreadcrumb, NBreadcrumbItem } from 'naive-ui';
import type { BreadcrumbItem } from '@/types';

interface Props {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  showHeader?: boolean;
}

withDefaults(defineProps<Props>(), {
  showHeader: true,
});

const emit = defineEmits<{
  'breadcrumb-click': [item: BreadcrumbItem];
}>();

// 处理面包屑点击
const handleBreadcrumbClick = (item: BreadcrumbItem) => {
  if (item.path) {
    emit('breadcrumb-click', item);
  }
};
</script>

<style scoped lang="scss">
.page-container {
  margin: 16px;
  background: #fff;
  border-radius: 6px;
  box-shadow: 0 1px 2px rgb(0 0 0 / 3%);

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 16px 0;

    .page-title {
      flex: 1;

      h1 {
        margin: 0;
        font-size: 20px;
        font-weight: 600;
        color: #262626;
      }

      .page-description {
        margin: 8px 0 0;
        font-size: 14px;
        color: #8c8c8c;
      }
    }

    .page-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  }

  .page-breadcrumb {
    padding: 0 24px 16px;
    border-bottom: 1px solid #f0f0f0;
    margin-bottom: 16px;
  }

  .page-content {
    padding: 0 24px 24px;
  }
}
</style>
