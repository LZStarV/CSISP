<template>
  <PageContainer
    title="课程管理"
    description="管理系统课程信息，包括课程创建、编辑、班级管理等功能"
    :breadcrumbs="breadcrumbs"
  >
    <template #actions>
      <n-button type="primary" @click="handleCreate">
        <template #icon>
          <n-icon><add-outline /></n-icon>
        </template>
        新增课程
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

    <!-- 课程表格 -->
    <BaseTable
      :data="courses"
      :columns="columns"
      :loading="loading"
      :pagination="pagination"
      row-key="id"
      selectable
      @select="handleSelectionChange"
    >
      <template #toolbar-left>
        <n-space>
          <n-button type="error" :disabled="selectedRowKeys.length === 0" @click="handleBatchDelete">
            <template #icon>
              <n-icon><trash-outline /></n-icon>
            </template>
            批量删除
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

    <!-- 课程编辑模态框 -->
    <BaseModal
      v-model:show="showModal"
      :title="modalTitle"
      width="800px"
      @ok="handleSubmit"
      @cancel="handleModalCancel"
    >
      <n-tabs v-model:value="activeTab" type="line">
        <n-tab-pane name="basic" tab="基本信息">
          <BaseForm
            ref="basicFormRef"
            :fields="basicFormFields"
            :model="formModel"
            :rules="basicFormRules"
            label-width="100px"
          />
        </n-tab-pane>
        <n-tab-pane name="teachers" tab="授课教师">
          <TeacherManagement :course-id="currentCourse?.id" />
        </n-tab-pane>
        <n-tab-pane name="classes" tab="班级管理">
          <ClassManagement :course-id="currentCourse?.id" />
        </n-tab-pane>
        <n-tab-pane name="schedule" tab="课程安排">
          <ScheduleManagement :course-id="currentCourse?.id" />
        </n-tab-pane>
      </n-tabs>
    </BaseModal>
  </PageContainer>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useMessage, useDialog } from 'naive-ui';
import { AddOutline, TrashOutline, RefreshOutline } from '@vicons/ionicons5';
import { BaseTable, BaseSearch, BaseModal, BaseForm, PageContainer } from '@/components';
import { useCourseStore } from '@/stores';
import type { Course, TableColumn, SearchField, FormField } from '@/types';

// 子组件
const TeacherManagement = defineAsyncComponent(() => import('./course/TeacherManagement.vue'));
const ClassManagement = defineAsyncComponent(() => import('./course/ClassManagement.vue'));
const ScheduleManagement = defineAsyncComponent(() => import('./course/ScheduleManagement.vue'));

// 状态管理
const courseStore = useCourseStore();
const message = useMessage();
const dialog = useDialog();

// 数据状态
const courses = computed(() => courseStore.state.courses);
const loading = computed(() => courseStore.state.loading);
const selectedRowKeys = ref<string[]>([]);

// 模态框状态
const showModal = ref(false);
const modalType = ref<'create' | 'edit'>('create');
const currentCourse = ref<Course | null>(null);
const activeTab = ref('basic');

// 搜索表单
const searchModel = reactive({
  keyword: '',
  semester: null,
  academicYear: null,
  status: null,
});

const searchFields: SearchField[] = [
  {
    key: 'keyword',
    label: '关键词',
    type: 'input',
    placeholder: '请输入课程名称或课程代码',
  },
  {
    key: 'semester',
    label: '学期',
    type: 'select',
    options: [
      { label: '全部', value: null },
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
    placeholder: '请输入学年',
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
];

// 表格列配置
const columns: TableColumn<Course>[] = [
  {
    key: 'id',
    title: 'ID',
    width: 80,
    sortable: true,
  },
  {
    key: 'courseName',
    title: '课程名称',
    width: 200,
    sortable: true,
  },
  {
    key: 'courseCode',
    title: '课程代码',
    width: 120,
    sortable: true,
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
    sortable: true,
    render: (value: number) => `${value}年`,
  },
  {
    key: 'availableMajors',
    title: '适用专业',
    width: 200,
    render: (value: string[]) => value.join(', '),
  },
  {
    key: 'status',
    title: '状态',
    width: 80,
    render: (value: number) => {
      return value === 1 
        ? <n-tag type="success" size="small">启用</n-tag>
        : <n-tag type="error" size="small">禁用</n-tag>;
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
    render: (value: any, record: Course) => {
      return (
        <n-space>
          <n-button 
            type="primary" 
            size="small" 
            quaternary
            onClick={() => handleEdit(record)}
          >
            编辑
          </n-button>
          <n-button 
            type="info" 
            size="small" 
            quaternary
            onClick={() => handleManage(record)}
          >
            管理
          </n-button>
          <n-popconfirm
            onPositiveClick={() => handleDelete(record)}
            positive-text="确定"
            negative-text="取消"
          >
            {{
              trigger: () => (
                <n-button type="error" size="small" quaternary>
                  删除
                </n-button>
              ),
              default: () => '确定要删除该课程吗？此操作不可恢复。',
            }}
          </n-popconfirm>
        </n-space>
      );
    },
  },
];

// 表单配置
const formModel = reactive({
  courseName: '',
  courseCode: '',
  semester: 1,
  academicYear: new Date().getFullYear(),
  availableMajors: [],
  status: 1,
});

const basicFormFields: FormField[] = [
  {
    key: 'courseName',
    label: '课程名称',
    type: 'input',
    required: true,
    placeholder: '请输入课程名称',
  },
  {
    key: 'courseCode',
    label: '课程代码',
    type: 'input',
    required: true,
    placeholder: '请输入课程代码',
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
    key: 'availableMajors',
    label: '适用专业',
    type: 'select',
    required: true,
    multiple: true,
    options: [
      { label: '计算机科学与技术', value: '计算机科学与技术' },
      { label: '软件工程', value: '软件工程' },
      { label: '信息安全', value: '信息安全' },
      { label: '人工智能', value: '人工智能' },
      { label: '数据科学与大数据技术', value: '数据科学与大数据技术' },
    ],
  },
  {
    key: 'status',
    label: '状态',
    type: 'switch',
    required: true,
  },
];

const basicFormRules = {
  courseName: [
    { required: true, message: '请输入课程名称' },
    { min: 2, max: 50, message: '课程名称长度应在2-50个字符之间' },
  ],
  courseCode: [
    { required: true, message: '请输入课程代码' },
    { min: 3, max: 20, message: '课程代码长度应在3-20个字符之间' },
  ],
  semester: [
    { required: true, type: 'number', message: '请选择学期' },
  ],
  academicYear: [
    { required: true, type: 'number', min: 2000, max: 3000, message: '请输入有效的学年' },
  ],
  availableMajors: [
    { required: true, type: 'array', min: 1, message: '请至少选择一个适用专业' },
  ],
};

// 计算属性
const modalTitle = computed(() => {
  return modalType.value === 'create' ? '新增课程' : '编辑课程';
});

const breadcrumbs = computed(() => [
  { label: '首页', path: '/' },
  { label: '课程管理' },
]);

const pagination = computed(() => ({
  current: 1,
  pageSize: 10,
  total: courses.value.length,
  showSizeChanger: true,
  showQuickJumper: true,
  onChange: (page: number, pageSize: number) => {
    console.log('Page changed:', page, pageSize);
  },
}));

// 方法
const handleSearch = async () => {
  try {
    await courseStore.getCourses(searchModel);
  } catch (error) {
    console.error('Search failed:', error);
  }
};

const handleReset = () => {
  Object.assign(searchModel, {
    keyword: '',
    semester: null,
    academicYear: null,
    status: null,
  });
  handleSearch();
};

const handleRefresh = () => {
  handleSearch();
};

const handleCreate = () => {
  modalType.value = 'create';
  currentCourse.value = null;
  activeTab.value = 'basic';
  // 重置表单
  Object.assign(formModel, {
    courseName: '',
    courseCode: '',
    semester: 1,
    academicYear: new Date().getFullYear(),
    availableMajors: [],
    status: 1,
  });
  showModal.value = true;
};

const handleEdit = (course: Course) => {
  modalType.value = 'edit';
  currentCourse.value = course;
  activeTab.value = 'basic';
  // 填充表单
  Object.assign(formModel, {
    courseName: course.courseName,
    courseCode: course.courseCode,
    semester: course.semester,
    academicYear: course.academicYear,
    availableMajors: course.availableMajors,
    status: course.status,
  });
  showModal.value = true;
};

const handleManage = (course: Course) => {
  currentCourse.value = course;
  modalType.value = 'edit';
  activeTab.value = 'teachers';
  showModal.value = true;
};

const handleSubmit = async () => {
  try {
    if (modalType.value === 'create') {
      await courseStore.createCourse(formModel);
    } else if (currentCourse.value) {
      await courseStore.updateCourse(currentCourse.value.id, formModel);
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

const handleDelete = async (course: Course) => {
  try {
    await courseStore.deleteCourse(course.id);
    message.success('删除课程成功');
  } catch (error) {
    console.error('Delete failed:', error);
  }
};

const handleBatchDelete = () => {
  if (selectedRowKeys.value.length === 0) {
    message.warning('请选择要删除的课程');
    return;
  }

  dialog.warning({
    title: '批量删除确认',
    content: `确定要删除选中的 ${selectedRowKeys.value.length} 个课程吗？此操作不可恢复。`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        for (const key of selectedRowKeys.value) {
          const courseId = parseInt(key);
          await courseStore.deleteCourse(courseId);
        }
        message.success('批量删除成功');
        selectedRowKeys.value = [];
      } catch (error) {
        console.error('Batch delete failed:', error);
      }
    },
  });
};

const handleSelectionChange = (keys: string[], rows: Course[]) => {
  selectedRowKeys.value = keys;
};

// 生命周期
onMounted(() => {
  handleSearch();
});
</script>

<style scoped lang="scss">
.course-management {
  .search-form {
    margin-bottom: 16px;
  }
}
</style>