<template>
  <div class="teacher-management">
    <div class="toolbar">
      <n-space>
        <n-button type="primary" size="small" @click="handleAddTeacher">
          <template #icon>
            <n-icon><add-outline /></n-icon>
          </template>
          添加教师
        </n-button>
      </n-space>
    </div>

    <BaseTable
      :data="teachers"
      :columns="columns"
      :loading="loading"
      :pagination="false"
      row-key="id"
    />

    <!-- 添加教师模态框 -->
    <BaseModal
      v-model:show="showModal"
      title="添加教师"
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
import type { Teacher, TableColumn, FormField } from '@/types';
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
const teachers = computed(() => courseStore.state.teachers);
const loading = computed(() => courseStore.state.loading);

// 模态框状态
const showModal = ref(false);

// 表单状态
const formModel = reactive({
  userId: null,
  teacherId: '',
  realName: '',
  email: '',
  phone: '',
  department: '',
  title: '',
  status: 1,
});

const formFields: FormField[] = [
  {
    key: 'userId',
    label: '关联用户',
    type: 'select',
    required: true,
    placeholder: '请选择用户',
    options: [], // 这里应该从用户列表中选择
  },
  {
    key: 'teacherId',
    label: '工号',
    type: 'input',
    required: true,
    placeholder: '请输入教师工号',
  },
  {
    key: 'realName',
    label: '姓名',
    type: 'input',
    required: true,
    placeholder: '请输入真实姓名',
  },
  {
    key: 'email',
    label: '邮箱',
    type: 'input',
    required: true,
    placeholder: '请输入邮箱地址',
  },
  {
    key: 'phone',
    label: '手机号',
    type: 'input',
    required: true,
    placeholder: '请输入手机号',
  },
  {
    key: 'department',
    label: '部门',
    type: 'input',
    required: true,
    placeholder: '请输入所属部门',
  },
  {
    key: 'title',
    label: '职称',
    type: 'input',
    required: true,
    placeholder: '请输入职称',
  },
  {
    key: 'status',
    label: '状态',
    type: 'switch',
    required: true,
  },
];

const formRules = {
  userId: [{ required: true, type: 'number', message: '请选择关联用户' }],
  teacherId: [
    { required: true, message: '请输入教师工号' },
    { pattern: /^\d{11}$/, message: '工号应为11位数字' },
  ],
  realName: [{ required: true, message: '请输入真实姓名' }],
  email: [
    { required: true, message: '请输入邮箱地址' },
    { type: 'email', message: '请输入有效的邮箱地址' },
  ],
  phone: [
    { required: true, message: '请输入手机号' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' },
  ],
  department: [{ required: true, message: '请输入所属部门' }],
  title: [{ required: true, message: '请输入职称' }],
};

// 表格列配置
const columns: TableColumn<Teacher>[] = [
  {
    key: 'id',
    title: 'ID',
    width: 80,
  },
  {
    key: 'teacherId',
    title: '工号',
    width: 120,
    sortable: true,
  },
  {
    key: 'realName',
    title: '姓名',
    width: 120,
    sortable: true,
  },
  {
    key: 'email',
    title: '邮箱',
    width: 180,
  },
  {
    key: 'phone',
    title: '手机号',
    width: 120,
  },
  {
    key: 'department',
    title: '部门',
    width: 150,
  },
  {
    key: 'title',
    title: '职称',
    width: 120,
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
    render: (value: any, record: Teacher) => {
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
                default: () => '确定要删除该教师吗？',
              }
            ),
          ],
        }
      );
    },
  },
];

// 方法
const handleAddTeacher = () => {
  // 重置表单
  Object.assign(formModel, {
    userId: null,
    teacherId: '',
    realName: '',
    email: '',
    phone: '',
    department: '',
    title: '',
    status: 1,
  });
  showModal.value = true;
};

const handleEdit = (teacher: Teacher) => {
  // 填充表单数据
  Object.assign(formModel, {
    userId: teacher.userId,
    teacherId: teacher.teacherId,
    realName: teacher.realName,
    email: teacher.email,
    phone: teacher.phone,
    department: teacher.department,
    title: teacher.title,
    status: teacher.status,
  });
  showModal.value = true;
};

const handleSubmit = async () => {
  try {
    const teacherData = {
      ...formModel,
      userId: formModel.userId || undefined,
    };
    await courseStore.createTeacher(teacherData);
    message.success('添加教师成功');
    showModal.value = false;
    // 刷新教师列表
    await courseStore.getTeachers({ courseId: props.courseId });
  } catch (error) {
    console.error('Submit failed:', error);
  }
};

const handleCancel = () => {
  showModal.value = false;
};

const handleDelete = async (teacher: Teacher) => {
  try {
    await courseStore.deleteTeacher(teacher.id);
    message.success('删除教师成功');
  } catch (error) {
    console.error('Delete failed:', error);
  }
};

// 生命周期
onMounted(() => {
  if (props.courseId) {
    courseStore.getTeachers({ courseId: props.courseId });
  }
});
</script>

<style scoped lang="scss">
.teacher-management {
  .toolbar {
    margin-bottom: 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}
</style>
