<template>
  <div class="class-management">
    <div class="toolbar">
      <n-space>
        <n-button type="primary" size="small" @click="handleAddClass">
          <template #icon>
            <n-icon><add-outline /></n-icon>
          </template>
          新增班级
        </n-button>
      </n-space>
    </div>

    <BaseTable
      :data="classes"
      :columns="columns"
      :loading="loading"
      :pagination="false"
      row-key="id"
    />

    <!-- 班级编辑模态框 -->
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
import { AddOutline } from '@vicons/ionicons5';
import { useMessage } from 'naive-ui';
import { NTag, NSpace, NButton, NPopconfirm } from 'naive-ui';
import { ref, reactive, computed, onMounted, h } from 'vue';

import { BaseTable, BaseModal, BaseForm } from '@/components';
import { useCourseStore } from '@/stores';
import type { Class, TableColumn, FormField } from '@/types';

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
const classes = computed(() => courseStore.state.classes);
const loading = computed(() => courseStore.state.loading);

// 模态框状态
const showModal = ref(false);
const modalType = ref<'create' | 'edit'>('create');
const currentClass = ref<Class | null>(null);

// 表单状态
const formModel = reactive({
  className: '',
  courseId: props.courseId,
  teacherId: null,
  semester: 1,
  academicYear: new Date().getFullYear(),
  maxStudents: 50,
  status: 1,
});

const formFields: FormField[] = [
  {
    key: 'className',
    label: '班级名称',
    type: 'input',
    required: true,
    placeholder: '请输入班级名称',
  },
  {
    key: 'teacherId',
    label: '授课教师',
    type: 'select',
    required: true,
    placeholder: '请选择授课教师',
    options: [], // 这里应该从教师列表中选择
  },
  {
    key: 'semester',
    label: '学期',
    type: 'select',
    required: true,
    options: [
      { label: '第一学期', value: 1 },
      { label: '第二学期', value: 2 },
      { label: '第三学期', value: 3 },
      { label: '第四学期', value: 4 },
      { label: '第五学期', value: 5 },
      { label: '第六学期', value: 6 },
      { label: '第七学期', value: 7 },
      { label: '第八学期', value: 8 },
    ],
  },
  {
    key: 'academicYear',
    label: '学年',
    type: 'number',
    required: true,
    placeholder: '请输入学年',
  },
  {
    key: 'maxStudents',
    label: '最大人数',
    type: 'number',
    required: true,
    placeholder: '请输入最大学生数',
  },
  {
    key: 'status',
    label: '状态',
    type: 'switch',
    required: true,
  },
];

const formRules = {
  className: [
    { required: true, message: '请输入班级名称' },
    { min: 2, max: 50, message: '班级名称长度应在2-50个字符之间' },
  ],
  teacherId: [{ required: true, type: 'number', message: '请选择授课教师' }],
  semester: [{ required: true, type: 'number', message: '请选择学期' }],
  academicYear: [
    {
      required: true,
      type: 'number',
      min: 2000,
      max: 3000,
      message: '请输入有效的学年',
    },
  ],
  maxStudents: [
    {
      required: true,
      type: 'number',
      min: 1,
      max: 200,
      message: '最大学生数应在1-200之间',
    },
  ],
};

// 表格列配置
const columns: TableColumn<Class>[] = [
  {
    key: 'id',
    title: 'ID',
    width: 80,
  },
  {
    key: 'className',
    title: '班级名称',
    width: 200,
    sortable: true,
  },
  {
    key: 'teacherId',
    title: '授课教师',
    width: 120,
    render: (value: number) => `教师${value}`, // 这里应该显示教师姓名
  },
  {
    key: 'semester',
    title: '学期',
    width: 100,
    render: (value: number) => `第${value}学期`,
  },
  {
    key: 'academicYear',
    title: '学年',
    width: 100,
    render: (value: number) => `${value}年`,
  },
  {
    key: 'maxStudents',
    title: '最大人数',
    width: 100,
  },
  {
    key: 'currentStudents',
    title: '当前人数',
    width: 100,
    render: () => '0', // 这里应该显示当前学生数
  },
  {
    key: 'status',
    title: '状态',
    width: 80,
    render: (value: number) => {
      return value === 1
        ? h(
            NTag,
            { type: 'success' as any, size: 'small' },
            { default: () => '启用' }
          )
        : h(
            NTag,
            { type: 'error' as any, size: 'small' },
            { default: () => '禁用' }
          );
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
    render: (value: any, record: Class) => {
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
                default: () => '确定要删除该班级吗？',
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
  return modalType.value === 'create' ? '新增班级' : '编辑班级';
});

// 方法
const handleAddClass = () => {
  modalType.value = 'create';
  currentClass.value = null;
  // 重置表单
  Object.assign(formModel, {
    className: '',
    courseId: props.courseId,
    teacherId: undefined,
    semester: 1,
    academicYear: new Date().getFullYear(),
    maxStudents: 50,
    status: 1,
  });
  showModal.value = true;
};

const handleEdit = (classItem: Class) => {
  modalType.value = 'edit';
  currentClass.value = classItem;
  // 填充表单
  Object.assign(formModel, {
    className: classItem.className,
    courseId: classItem.courseId,
    teacherId: classItem.teacherId,
    semester: classItem.semester,
    academicYear: classItem.academicYear,
    maxStudents: classItem.maxStudents,
    status: classItem.status,
  });
  showModal.value = true;
};

const handleSubmit = async () => {
  try {
    const classData = {
      ...formModel,
      teacherId: formModel.teacherId || undefined,
    };
    if (modalType.value === 'create') {
      await courseStore.createClass(classData);
      message.success('创建班级成功');
    } else if (currentClass.value) {
      await courseStore.updateClass(currentClass.value.id, classData);
      message.success('更新班级成功');
    }
    showModal.value = false;
    // 刷新班级列表
    if (props.courseId) {
      await courseStore.getClasses({ courseId: props.courseId });
    }
  } catch (error) {
    console.error('Submit failed:', error);
  }
};

const handleCancel = () => {
  showModal.value = false;
};

const handleDelete = async (classItem: Class) => {
  try {
    await courseStore.deleteClass(classItem.id);
    message.success('删除班级成功');
  } catch (error) {
    console.error('Delete failed:', error);
  }
};

// 生命周期
onMounted(() => {
  if (props.courseId) {
    courseStore.getClasses({ courseId: props.courseId });
  }
});
</script>

<style scoped lang="scss">
.class-management {
  .toolbar {
    margin-bottom: 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}
</style>
