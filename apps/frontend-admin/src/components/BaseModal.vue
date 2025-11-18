<template>
  <n-modal
    v-model:show="showModal"
    :preset="preset"
    :title="title"
    :width="width"
    :closable="closable"
    :mask-closable="maskClosable"
    :close-on-esc="closeOnEsc"
    :show-icon="showIcon"
    :type="type"
    :positive-text="okText"
    :negative-text="cancelText"
    :positive-button-props="okButtonProps"
    :negative-button-props="cancelButtonProps"
    :loading="loading"
    :auto-focus="autoFocus"
    @positive-click="handleOk"
    @negative-click="handleCancel"
    @close="handleClose"
    @after-leave="handleAfterLeave"
  >
    <template #header v-if="$slots.header">
      <slot name="header" />
    </template>

    <template #icon v-if="$slots.icon">
      <slot name="icon" />
    </template>

    <template #action v-if="$slots.action">
      <slot name="action" />
    </template>

    <slot />
  </n-modal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { NModal } from 'naive-ui';

interface Props {
  show: boolean;
  title: string;
  preset?: 'dialog' | 'card';
  width?: string | number;
  closable?: boolean;
  maskClosable?: boolean;
  closeOnEsc?: boolean;
  showIcon?: boolean;
  type?: 'default' | 'info' | 'success' | 'warning' | 'error';
  okText?: string;
  cancelText?: string;
  okButtonProps?: Record<string, any>;
  cancelButtonProps?: Record<string, any>;
  loading?: boolean;
  autoFocus?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  preset: 'card',
  width: 520,
  closable: true,
  maskClosable: true,
  closeOnEsc: true,
  showIcon: false,
  type: 'default',
  okText: '确定',
  cancelText: '取消',
  loading: false,
  autoFocus: true,
});

const emit = defineEmits<{
  'update:show': [value: boolean];
  ok: [];
  cancel: [];
  close: [];
  'after-leave': [];
}>();

const showModal = ref(props.show);

// 监听show属性变化
watch(
  () => props.show,
  newVal => {
    showModal.value = newVal;
  }
);

// 监听内部show变化
watch(showModal, newVal => {
  emit('update:show', newVal);
});

// 处理确定按钮点击
const handleOk = () => {
  emit('ok');
};

// 处理取消按钮点击
const handleCancel = () => {
  emit('cancel');
  showModal.value = false;
};

// 处理关闭
const handleClose = () => {
  emit('close');
};

// 处理动画结束
const handleAfterLeave = () => {
  emit('after-leave');
};

// 暴露方法
defineExpose({
  show: () => {
    showModal.value = true;
  },
  hide: () => {
    showModal.value = false;
  },
});
</script>

<style scoped lang="scss">
.base-modal {
  :deep(.n-modal) {
    .n-card-header {
      padding: 16px 24px;
    }

    .n-card__content {
      padding: 24px;
    }

    .n-card__action {
      padding: 16px 24px;
      border-top: 1px solid #f0f0f0;
    }
  }
}
</style>
