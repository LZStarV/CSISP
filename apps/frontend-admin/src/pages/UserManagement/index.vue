<template>
  <PageContainer
    title="用户管理"
    description="管理系统用户信息，包括学生、教师等账户"
    :breadcrumbs="breadcrumbs"
  >
    <template #actions>
      <n-button type="primary" @click="handleCreate">
        <template #icon>
          <n-icon><add-outline /></n-icon>
        </template>
        新增用户
      </n-button>
    </template>

    <!-- 搜索表单 -->
    <BaseSearch
      :fields="searchFields"
      :model="searchModel"
      :loading="loading"
      @search="handleSearch"
      @reset="handleReset"
    />

    <!-- 用户表格 -->
    <BaseTable
      :data="users"
      :columns="columns"
      :loading="loading"
      :pagination="pagination"
      row-key="id"
      selectable
      @select="handleSelectionChange"
    >
      <template #toolbar-left>
        <n-space>
          <n-button
            type="error"
            :disabled="selectedRowKeys.length === 0"
            @click="handleBatchDelete"
          >
            <template #icon>
              <n-icon><trash-outline /></n-icon>
            </template>
            批量删除
          </n-button>
          <n-button :disabled="selectedRowKeys.length === 0" @click="handleBatchExport">
            <template #icon>
              <n-icon><download-outline /></n-icon>
            </template>
            导出选中
          </n-button>
        </n-space>
      </template>
      <template #toolbar-right>
        <n-space>
          <n-button @click="handleRefresh">
            <template #icon>
              <n-icon><refresh-outline /></n-icon>
            </template>
            刷新
          </n-button>
        </n-space>
      </template>
    </BaseTable>

    <!-- 用户编辑模态框 -->
    <BaseModal
      v-model:show="showModal"
      :title="modalTitle"
      width="600px"
      @ok="handleSubmit"
      @cancel="handleModalCancel"
    >
      <BaseForm
        ref="formRef"
        :fields="formFields"
        :model="formModel"
        :rules="formRules"
        label-width="100px"
      />
    </BaseModal>
  </PageContainer>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, h } from 'vue';
import { useMessage, useDialog } from 'naive-ui';
import { AddOutline, TrashOutline, DownloadOutline, RefreshOutline } from '@vicons/ionicons5';
import { BaseTable, BaseSearch, BaseModal, BaseForm, PageContainer } from '@/components';
import { useUserStore } from '@/stores';
import type { User, TableColumn, SearchField, FormField } from '@/types';
import { NTag, NSpace, NButton, NPopconfirm } from 'naive-ui';

// 状态管理
const userStore = useUserStore();
const message = useMessage();
const dialog = useDialog();

// 数据状态
const users = computed(() => userStore.state.users);
const loading = computed(() => userStore.state.loading);
const selectedRowKeys = ref<string[]>([]);

// 模态框状态
const showModal = ref(false);
const modalType = ref<'create' | 'edit'>('create');
const currentUser = ref<User | null>(null);

// 搜索表单
const searchModel = reactive({
  keyword: '',
  status: null,
  role: null,
  dateRange: null,
});

const searchFields: SearchField[] = [
  {
    key: 'keyword',
    label: '关键词',
    type: 'input',
    placeholder: '请输入用户名、姓名或学号',
  },
  {
    key: 'status',
    label: '状态',
    type: 'select',
    options: [
      { label: '全部', value: null },
      { label: '启用', value: 1 },
      { label: '禁用', value: 0 },
    ],
  },
  {
    key: 'role',
    label: '角色',
    type: 'select',
    options: [
      { label: '全部', value: null },
      { label: '学生', value: 'student' },
      { label: '教师', value: 'teacher' },
      { label: '管理员', value: 'admin' },
    ],
  },
  {
    key: 'dateRange',
    label: '创建时间',
    type: 'daterange',
  },
];

// 表格列配置
const columns: TableColumn<User>[] = [
  {
    key: 'id',
    title: 'ID',
    width: 80,
    sortable: true,
  },
  {
    key: 'username',
    title: '用户名',
    width: 120,
    sortable: true,
  },
  {
    key: 'realName',
    title: '真实姓名',
    width: 120,
    sortable: true,
  },
  {
    key: 'studentId',
    title: '学号',
    width: 140,
    sortable: true,
  },
  {
    key: 'major',
    title: '专业',
    width: 150,
  },
  {
    key: 'enrollmentYear',
    title: '入学年份',
    width: 120,
    sortable: true,
    render: (value: number) => `${value}年`,
  },
  {
    key: 'status',
    title: '状态',
    width: 80,
    render: (value: number) => {
      return value === 1
        ? h(NTag, { type: 'success', size: 'small' }, { default: () => '启用' })
        : h(NTag, { type: 'error', size: 'small' }, { default: () => '禁用' });
    },
  },
  {
    key: 'createdAt',
    title: '创建时间',
    width: 180,
    sortable: true,
    render: (value: string) => {
      return new Date(value).toLocaleString();
    },
  },
  {
    key: 'actions',
    title: '操作',
    width: 200,
    render: (value: any, record: User) => {
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
              NButton,
              {
                type: record.status === 1 ? 'error' : 'success',
                size: 'small',
                quaternary: true,
                onClick: () => handleToggleStatus(record),
              },
              { default: () => (record.status === 1 ? '禁用' : '启用') }
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
                default: () => '确定要删除该用户吗？此操作不可恢复。',
              }
            ),
          ],
        }
      );
    },
  },
];

// 表单配置
const formModel = reactive({
  username: '',
  password: '',
  realName: '',
  studentId: '',
  major: '',
  enrollmentYear: new Date().getFullYear(),
  status: 1,
});

const formFields: FormField[] = [
  {
    key: 'username',
    label: '用户名',
    type: 'input',
    required: true,
    placeholder: '请输入用户名',
  },
  {
    key: 'password',
    label: '密码',
    type: 'input',
    required: true,
    placeholder: '请输入密码',
  },
  {
    key: 'realName',
    label: '真实姓名',
    type: 'input',
    required: true,
    placeholder: '请输入真实姓名',
  },
  {
    key: 'studentId',
    label: '学号',
    type: 'input',
    required: true,
    placeholder: '请输入学号',
  },
  {
    key: 'major',
    label: '专业',
    type: 'input',
    required: true,
    placeholder: '请输入专业',
  },
  {
    key: 'enrollmentYear',
    label: '入学年份',
    type: 'number',
    required: true,
    placeholder: '请选择入学年份',
  },
  {
    key: 'status',
    label: '状态',
    type: 'switch',
    required: true,
  },
];

const formRules = {
  username: [
    { required: true, message: '请输入用户名' },
    { min: 3, max: 20, message: '用户名长度应在3-20个字符之间' },
  ],
  password: [
    { required: true, message: '请输入密码' },
    { min: 6, message: '密码长度至少为6个字符' },
  ],
  realName: [{ required: true, message: '请输入真实姓名' }],
  studentId: [
    { required: true, message: '请输入学号' },
    { pattern: /^\d{11}$/, message: '学号应为11位数字' },
  ],
  major: [{ required: true, message: '请输入专业' }],
  enrollmentYear: [
    { required: true, type: 'number', min: 2000, max: 3000, message: '请输入有效的入学年份' },
  ],
};

// 计算属性
const modalTitle = computed(() => {
  return modalType.value === 'create' ? '新增用户' : '编辑用户';
});

const breadcrumbs = computed(() => [{ label: '首页', path: '/' }, { label: '用户管理' }]);

const pagination = computed(() => ({
  current: 1,
  pageSize: 10,
  total: users.value.length,
  showSizeChanger: true,
  showQuickJumper: true,
  onChange: (page: number) => {
    console.log('Page changed:', page);
  },
}));

// 方法
const handleSearch = async () => {
  try {
    await userStore.getUsers(searchModel);
  } catch (error) {
    console.error('Search failed:', error);
  }
};

const handleReset = () => {
  Object.assign(searchModel, {
    keyword: '',
    status: null,
    role: null,
    dateRange: null,
  });
  handleSearch();
};

const handleRefresh = () => {
  handleSearch();
};

const handleCreate = () => {
  modalType.value = 'create';
  currentUser.value = null;
  // 重置表单
  Object.assign(formModel, {
    username: '',
    password: '',
    realName: '',
    studentId: '',
    major: '',
    enrollmentYear: new Date().getFullYear(),
    status: 1,
  });
  showModal.value = true;
};

const handleEdit = (user: User) => {
  modalType.value = 'edit';
  currentUser.value = user;
  // 填充表单
  Object.assign(formModel, {
    username: user.username,
    password: '', // 编辑时不显示密码
    realName: user.realName,
    studentId: user.studentId,
    major: user.major,
    enrollmentYear: user.enrollmentYear,
    status: user.status,
  });
  showModal.value = true;
};

const handleSubmit = async () => {
  try {
    if (modalType.value === 'create') {
      await userStore.createUser(formModel);
    } else if (currentUser.value) {
      await userStore.updateUser(currentUser.value.id, formModel);
    }
    showModal.value = false;
    handleSearch();
  } catch (error) {
    console.error('Submit failed:', error);
  }
};

const handleModalCancel = () => {
  showModal.value = false;
};

const handleToggleStatus = async (user: User) => {
  try {
    const newStatus = user.status === 1 ? 0 : 1;
    await userStore.updateUser(user.id, { status: newStatus });
    message.success(`用户${newStatus === 1 ? '启用' : '禁用'}成功`);
  } catch (error) {
    console.error('Toggle status failed:', error);
  }
};

const handleDelete = async (user: User) => {
  try {
    await userStore.deleteUser(user.id);
    message.success('删除用户成功');
  } catch (error) {
    console.error('Delete failed:', error);
  }
};

const handleBatchDelete = () => {
  if (selectedRowKeys.value.length === 0) {
    message.warning('请选择要删除的用户');
    return;
  }

  dialog.warning({
    title: '批量删除确认',
    content: `确定要删除选中的 ${selectedRowKeys.value.length} 个用户吗？此操作不可恢复。`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        // 批量删除逻辑
        for (const key of selectedRowKeys.value) {
          const userId = parseInt(key);
          await userStore.deleteUser(userId);
        }
        message.success('批量删除成功');
        selectedRowKeys.value = [];
      } catch (error) {
        console.error('Batch delete failed:', error);
      }
    },
  });
};

const handleBatchExport = () => {
  message.info('导出功能开发中...');
};

const handleSelectionChange = (keys: string[], rows: User[]) => {
  selectedRowKeys.value = keys;
};

// 生命周期
onMounted(() => {
  handleSearch();
});
</script>

<style scoped lang="scss">
.user-management {
  .search-form {
    margin-bottom: 16px;
  }
}
</style>
