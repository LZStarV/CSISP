<template>
  <n-form
    ref="formRef"
    :model="model"
    :rules="rules"
    :label-width="labelWidth"
    :label-placement="labelPlacement"
    :size="size"
    :show-feedback="showFeedback"
    :show-label="showLabel"
  >
    <n-form-item v-for="field in fields" :key="field.key" :label="field.label" :path="field.key">
      <!-- 输入框 -->
      <n-input
        v-if="field.type === 'input'"
        :value="model[field.key]"
        @update:value="value => handleFieldChange(field.key, value)"
        :placeholder="field.placeholder || `请输入${field.label}`"
        :disabled="field.disabled"
        :maxlength="field.maxlength"
        :show-count="field.showCount"
      />

      <!-- 数字输入框 -->
      <n-input-number
        v-else-if="field.type === 'number'"
        :value="model[field.key]"
        @update:value="value => handleFieldChange(field.key, value)"
        :placeholder="field.placeholder || `请输入${field.label}`"
        :disabled="field.disabled"
        :min="field.min"
        :max="field.max"
        :step="field.step"
        style="width: 100%"
      />

      <!-- 文本域 -->
      <n-input
        v-else-if="field.type === 'textarea'"
        :value="model[field.key]"
        @update:value="value => handleFieldChange(field.key, value)"
        type="textarea"
        :placeholder="field.placeholder || `请输入${field.label}`"
        :disabled="field.disabled"
        :rows="field.rows || 3"
        :maxlength="field.maxlength"
        :show-count="field.showCount"
      />

      <!-- 选择器 -->
      <n-select
        v-else-if="field.type === 'select'"
        :value="model[field.key]"
        @update:value="value => handleFieldChange(field.key, value)"
        :placeholder="field.placeholder || `请选择${field.label}`"
        :disabled="field.disabled"
        :options="field.options"
        :multiple="field.multiple"
        :clearable="field.clearable !== false"
        :filterable="field.filterable !== false"
      />

      <!-- 日期选择器 -->
      <n-date-picker
        v-else-if="field.type === 'date'"
        :value="model[field.key]"
        @update:value="value => handleFieldChange(field.key, value)"
        :placeholder="field.placeholder || `请选择${field.label}`"
        :disabled="field.disabled"
        :type="field.dateType || 'date'"
        :format="field.format"
        :clearable="field.clearable !== false"
        style="width: 100%"
      />

      <!-- 开关 -->
      <n-switch
        v-else-if="field.type === 'switch'"
        :value="model[field.key]"
        @update:value="value => handleFieldChange(field.key, value)"
        :disabled="field.disabled"
        :size="field.size"
      >
        <template #checked>
          {{ field.checkedText || '是' }}
        </template>
        <template #unchecked>
          {{ field.uncheckedText || '否' }}
        </template>
      </n-switch>

      <!-- 自定义渲染 -->
      <template v-else-if="field.render">
        <component
          :is="field.render"
          :model-value="model[field.key]"
          @update:model-value="value => handleFieldChange(field.key, value)"
          :field="field"
          :model="model"
        />
      </template>
    </n-form-item>
  </n-form>
</template>

<script setup lang="ts">
import { ref, type PropType } from 'vue';
import { NForm, NFormItem, NInput, NInputNumber, NSelect, NDatePicker, NSwitch } from 'naive-ui';
import type { FormField } from '@/types';

const props = defineProps({
  fields: {
    type: Array as PropType<FormField[]>,
    required: true,
  },
  model: {
    type: Object as PropType<Record<string, any>>,
    required: true,
  },
  rules: {
    type: Object,
    default: () => ({}),
  },
  labelWidth: {
    type: [String, Number],
    default: 'auto',
  },
  labelPlacement: {
    type: String as PropType<'left' | 'top'>,
    default: 'top',
  },
  size: {
    type: String as PropType<'small' | 'medium' | 'large'>,
    default: 'medium',
  },
  showFeedback: {
    type: Boolean,
    default: true,
  },
  showLabel: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits<{
  submit: [];
  reset: [];
  'update:model': [model: Record<string, any>];
}>();

const formRef = ref();

// 处理字段值变化
const handleFieldChange = (key: string, value: any) => {
  const newModel = { ...props.model, [key]: value };
  emit('update:model', newModel);
};

// 表单验证
const validate = async () => {
  try {
    await formRef.value?.validate();
    return true;
  } catch (errors) {
    return false;
  }
};

// 重置表单
const reset = () => {
  formRef.value?.restoreValidation();
  emit('reset');
};

// 提交表单
const submit = async () => {
  const isValid = await validate();
  if (isValid) {
    emit('submit');
  }
};

// 暴露方法
defineExpose({
  validate,
  reset,
  submit,
});
</script>

<style scoped lang="scss">
.base-form {
  :deep(.n-form-item) {
    margin-bottom: 16px;
  }
}
</style>
