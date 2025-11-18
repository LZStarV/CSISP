<template>
  <div class="base-search">
    <n-form ref="formRef" :model="model" inline label-placement="left" :show-feedback="false">
      <n-form-item v-for="field in fields" :key="field.key" :label="field.label">
        <!-- 输入框 -->
        <n-input
          v-if="field.type === 'input'"
          v-model:value="model[field.key]"
          :placeholder="field.placeholder || `请输入${field.label}`"
          clearable
        />

        <!-- 选择器 -->
        <n-select
          v-else-if="field.type === 'select'"
          v-model:value="model[field.key]"
          :placeholder="field.placeholder || `请选择${field.label}`"
          :options="field.options"
          clearable
          filterable
        />

        <!-- 日期选择器 -->
        <n-date-picker
          v-else-if="field.type === 'date'"
          v-model:value="model[field.key]"
          :placeholder="field.placeholder || `请选择${field.label}`"
          clearable
          style="width: 200px"
        />

        <!-- 日期范围选择器 -->
        <n-date-picker
          v-else-if="field.type === 'daterange'"
          v-model:value="model[field.key]"
          type="daterange"
          :placeholder="field.placeholder || '请选择日期范围'"
          clearable
          style="width: 240px"
        />
      </n-form-item>

      <!-- 操作按钮 -->
      <n-form-item>
        <n-space>
          <n-button type="primary" :loading="loading" @click="handleSearch">
            <template #icon>
              <n-icon><search-outline /></n-icon>
            </template>
            搜索
          </n-button>
          <n-button :loading="loading" @click="handleReset"> 重置 </n-button>
          <slot name="extra-buttons" />
        </n-space>
      </n-form-item>
    </n-form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { NForm, NFormItem, NInput, NSelect, NDatePicker, NButton, NSpace, NIcon } from 'naive-ui';
import { SearchOutline } from '@vicons/ionicons5';
import type { SearchField, BaseSearchProps } from '@/types';

interface Props {
  fields: SearchField[];
  model: Record<string, any>;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

const emit = defineEmits<{
  search: [];
  reset: [];
}>();

const formRef = ref();

// 处理搜索
const handleSearch = () => {
  emit('search');
};

// 处理重置
const handleReset = () => {
  formRef.value?.restoreValidation();
  // 重置所有字段值为空
  props.fields.forEach(field => {
    if (field.type === 'daterange') {
      props.model[field.key] = null;
    } else {
      props.model[field.key] = '';
    }
  });
  emit('reset');
};
</script>

<style scoped lang="scss">
.base-search {
  background: #fff;
  padding: 16px;
  border-radius: 6px;
  margin-bottom: 16px;

  :deep(.n-form-item) {
    margin-bottom: 0;
    margin-right: 16px;
  }

  :deep(.n-form-item-label) {
    padding-right: 8px;
  }
}
</style>
