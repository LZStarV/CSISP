<template>
  <div class="schedule-management">
    <div class="toolbar">
      <n-space>
        <n-button type="primary" size="small" @click="handleAddSchedule">
          <template #icon>
            <n-icon><add-outline /></n-icon>
          </template>
          添加时间段
        </n-button>
      </n-space>
    </div>

    <BaseTable
      :data="timeSlots"
      :columns="columns"
      :loading="loading"
      :pagination="false"
      row-key="id"
    />

    <!-- 时间段编辑模态框 -->
    <BaseModal
      v-model:show="showModal"
      :title="modalTitle"
      width="500px"
      @ok="handleSubmit"
      @cancel="handleCancel"
    >
      <BaseForm
        ref="formRef"
        :fields="formFields"
        :model="formModel"
        :rules="formRules"
        label-width="80px"
      />
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, h } from 'vue';
import { useMessage } from 'naive-ui';
import { AddOutline } from '@vicons/ionicons5';
import { BaseTable, BaseModal, BaseForm } from '@/components';
import { useCourseStore } from '@/stores';
import type { TimeSlot, TableColumn, FormField } from '@/types';
import { NTag, NSpace, NButton, NPopconfirm } from 'naive-ui';

interface Props {
  courseId?: number;
}

const props = withDefaults(defineProps<Props>(), {
  courseId: undefined,
});

// 状态管理
const courseStore = useCourseStore();
const message = useMessage();

// 数据状态
const timeSlots = computed(() => courseStore.state.timeSlots);
const loading = computed(() => courseStore.state.loading);

// 模态框状态
const showModal = ref(false);
const modalType = ref<'create' | 'edit'>('create');
const currentTimeSlot = ref<TimeSlot | null>(null);

// 表单状态
const formModel = reactive({
  subCourseId: null,
  weekday: 1,
  startTime: '',
  endTime: '',
  location: '',
  status: 1,
});

const formFields: FormField[] = [
  {
    key: 'subCourseId',
    label: '子课程',
    type: 'select',
    required: true,
    placeholder: '请选择子课程',
    options: [], // 这里应该从子课程列表中选择
  },
  {
    key: 'weekday',
    label: '星期',
    type: 'select',
    required: true,
    options: [
      { label: '星期一', value: 1 },
      { label: '星期二', value: 2 },
      { label: '星期三', value: 3 },
      { label: '星期四', value: 4 },
      { label: '星期五', value: 5 },
      { label: '星期六', value: 6 },
      { label: '星期日', value: 7 },
    ],
  },
  {
    key: 'startTime',
    label: '开始时间',
    type: 'input',
    required: true,
    placeholder: '如: 08:00',
  },
  {
    key: 'endTime',
    label: '结束时间',
    type: 'input',
    required: true,
    placeholder: '如: 09:40',
  },
  {
    key: 'location',
    label: '上课地点',
    type: 'input',
    required: true,
    placeholder: '请输入上课地点',
  },
  {
    key: 'status',
    label: '状态',
    type: 'switch',
    required: true,
  },
];

const formRules = {
  subCourseId: [{ required: true, type: 'number', message: '请选择子课程' }],
  weekday: [{ required: true, type: 'number', message: '请选择星期' }],
  startTime: [
    { required: true, message: '请输入开始时间' },
    { pattern: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, message: '请输入有效的时间格式，如: 08:00' },
  ],
  endTime: [
    { required: true, message: '请输入结束时间' },
    { pattern: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, message: '请输入有效的时间格式，如: 09:40' },
  ],
  location: [{ required: true, message: '请输入上课地点' }],
};

// 表格列配置
const columns: TableColumn<TimeSlot>[] = [
  {
    key: 'id',
    title: 'ID',
    width: 80,
  },
  {
    key: 'weekday',
    title: '星期',
    width: 100,
    render: (value: number) => {
      const weekdays = ['', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'];
      return weekdays[value] || '';
    },
  },
  {
    key: 'startTime',
    title: '开始时间',
    width: 120,
  },
  {
    key: 'endTime',
    title: '结束时间',
    width: 120,
  },
  {
    key: 'location',
    title: '上课地点',
    width: 150,
  },
  {
    key: 'status',
    title: '状态',
    width: 80,
    render: (value: number) => {
      return value === 1
        ? h(NTag, { type: 'success' as any, size: 'small' }, { default: () => '启用' })
        : h(NTag, { type: 'error' as any, size: 'small' }, { default: () => '禁用' });
    },
  },
  {
    key: 'createdAt',
    title: '创建时间',
    width: 180,
    render: (value: string) => {
      return new Date(value).toLocaleString();
    },
  },
  {
    key: 'actions',
    title: '操作',
    width: 150,
    render: (value: any, record: TimeSlot) => {
      return h(
        NSpace,
        {},
        {
          default: () => [
            h(
              NButton,
              {
                type: 'primary',
                size: 'small',
                quaternary: true,
                onClick: () => handleEdit(record),
              },
              { default: () => '编辑' }
            ),
            h(
              NPopconfirm,
              {
                onPositiveClick: () => handleDelete(record),
                positiveText: '确定',
                negativeText: '取消',
              },
              {
                trigger: () =>
                  h(
                    NButton,
                    {
                      type: 'error',
                      size: 'small',
                      quaternary: true,
                    },
                    { default: () => '删除' }
                  ),
                default: () => '确定要删除该时间段吗？',
              }
            ),
          ],
        }
      );
    },
  },
];

// 计算属性
const modalTitle = computed(() => {
  return modalType.value === 'create' ? '添加时间段' : '编辑时间段';
});

// 方法
const handleAddSchedule = () => {
  modalType.value = 'create';
  currentTimeSlot.value = null;
  // 重置表单
  Object.assign(formModel, {
    subCourseId: undefined,
    weekday: 1,
    startTime: '',
    endTime: '',
    location: '',
    status: 1,
  });
  showModal.value = true;
};

const handleEdit = (timeSlot: TimeSlot) => {
  modalType.value = 'edit';
  currentTimeSlot.value = timeSlot;
  // 填充表单
  Object.assign(formModel, {
    subCourseId: timeSlot.subCourseId,
    weekday: timeSlot.weekday,
    startTime: timeSlot.startTime,
    endTime: timeSlot.endTime,
    location: timeSlot.location,
    status: timeSlot.status,
  });
  showModal.value = true;
};

const handleSubmit = async () => {
  try {
    const timeSlotData = {
      ...formModel,
      subCourseId: formModel.subCourseId || undefined,
    };
    if (modalType.value === 'create') {
      await courseStore.createTimeSlot(timeSlotData);
      message.success('添加时间段成功');
    } else if (currentTimeSlot.value) {
      await courseStore.updateTimeSlot(currentTimeSlot.value.id, timeSlotData);
      message.success('更新时间段成功');
    }
    showModal.value = false;
    // 刷新时间段列表
    if (props.courseId) {
      await courseStore.getTimeSlots({ courseId: props.courseId });
    }
  } catch (error) {
    console.error('Submit failed:', error);
  }
};

const handleCancel = () => {
  showModal.value = false;
};

const handleDelete = async (timeSlot: TimeSlot) => {
  try {
    await courseStore.deleteTimeSlot(timeSlot.id);
    message.success('删除时间段成功');
  } catch (error) {
    console.error('Delete failed:', error);
  }
};

// 生命周期
onMounted(() => {
  if (props.courseId) {
    courseStore.getTimeSlots({ courseId: props.courseId });
  }
});
</script>

<style scoped lang="scss">
.schedule-management {
  .toolbar {
    margin-bottom: 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}
</style>
