<template>
  <PageContainer
    title="作业管理"
    description="管理课程作业和学生提交情况"
    :breadcrumbs="breadcrumbs"
  >
    <template #actions>
      <n-button type="primary" @click="handleCreate">
        <template #icon>
          <n-icon><add-outline /></n-icon>
        </template>
        发布作业
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

    <!-- 作业表格 -->
    <BaseTable
      :data="homeworkList"
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
  </PageContainer>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, h } from 'vue';
import { useMessage, useDialog } from 'naive-ui';
import { RefreshOutline, AddOutline, TrashOutline, DownloadOutline } from '@vicons/ionicons5';
import { BaseTable, BaseSearch, PageContainer } from '@/components';
import type { TableColumn, SearchField } from '@/types';
import { NTag, NSpace, NButton, NPopconfirm } from 'naive-ui';

// 状态管理
const message = useMessage();
const dialog = useDialog();

// 数据状态
const loading = ref(false);
const selectedRowKeys = ref<string[]>([]);

// 搜索表单
const searchModel = reactive({
  keyword: '',
  courseId: null,
  status: null,
  dateRange: null,
});

const searchFields: SearchField[] = [
  {
    key: 'keyword',
    label: '关键词',
    type: 'input',
    placeholder: '请输入作业标题',
  },
  {
    key: 'courseId',
    label: '课程',
    type: 'select',
    placeholder: '请选择课程',
    options: [
      { label: '全部课程', value: null },
      { label: '数据结构', value: 1 },
      { label: '算法分析', value: 2 },
    ],
  },
  {
    key: 'status',
    label: '状态',
    type: 'select',
    options: [
      { label: '全部状态', value: null },
      { label: '进行中', value: 1 },
      { label: '已截止', value: 2 },
      { label: '已批改', value: 3 },
    ],
  },
  {
    key: 'dateRange',
    label: '发布时间',
    type: 'daterange',
  },
];

// 模拟作业数据
const homeworkList = ref([
  {
    id: 1,
    title: '数据结构第一次作业',
    courseName: '数据结构',
    teacherName: '李教授',
    publishTime: '2024-01-10 08:00',
    deadline: '2024-01-17 23:59',
    totalStudents: 45,
    submittedCount: 38,
    status: 1, // 进行中
    type: 1, // 个人作业
  },
  {
    id: 2,
    title: '算法分析期中项目',
    courseName: '算法分析',
    teacherName: '王教授',
    publishTime: '2024-01-05 10:00',
    deadline: '2024-01-20 23:59',
    totalStudents: 42,
    submittedCount: 35,
    status: 1, // 进行中
    type: 2, // 小组作业
  },
]);

// 表格列配置
const columns: TableColumn[] = [
  {
    key: 'id',
    title: 'ID',
    width: 80,
    sortable: true,
  },
  {
    key: 'title',
    title: '作业标题',
    width: 250,
    sortable: true,
  },
  {
    key: 'courseName',
    title: '课程名称',
    width: 150,
  },
  {
    key: 'teacherName',
    title: '发布教师',
    width: 120,
  },
  {
    key: 'publishTime',
    title: '发布时间',
    width: 160,
    sortable: true,
  },
  {
    key: 'deadline',
    title: '截止时间',
    width: 160,
    sortable: true,
  },
  {
    key: 'submission',
    title: '提交情况',
    width: 120,
    render: (value: any, record: any) => {
      return `${record.submittedCount}/${record.totalStudents}`;
    },
  },
  {
    key: 'status',
    title: '状态',
    width: 100,
    render: (value: number) => {
      const statusMap = {
        1: { label: '进行中', type: 'info' },
        2: { label: '已截止', type: 'warning' },
        3: { label: '已批改', type: 'success' },
      };
      const status = statusMap[value as keyof typeof statusMap];
      return h(
        'n-tag',
        { type: status.type as any, size: 'small' },
        { default: () => status.label }
      );
    },
  },
  {
    key: 'type',
    title: '类型',
    width: 100,
    render: (value: number) => {
      return value === 1 ? '个人作业' : '小组作业';
    },
  },
  {
    key: 'actions',
    title: '操作',
    width: 200,
    render: (value: any, record: any) => {
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
                onClick: () => handleView(record),
              },
              { default: () => '查看' }
            ),
            h(
              NButton,
              {
                type: 'info',
                size: 'small',
                quaternary: true,
                onClick: () => handleSubmissions(record),
              },
              { default: () => '提交情况' }
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
                default: () => '确定要删除该作业吗？',
              }
            ),
          ],
        }
      );
    },
  },
];

// 面包屑
const breadcrumbs = computed(() => [{ label: '首页', path: '/' }, { label: '作业管理' }]);

const pagination = computed(() => ({
  current: 1,
  pageSize: 10,
  total: homeworkList.value.length,
  showSizeChanger: true,
  showQuickJumper: true,
}));

// 方法
const handleSearch = async () => {
  loading.value = true;
  try {
    // 模拟搜索逻辑
    await new Promise(resolve => setTimeout(resolve, 500));
    message.success('搜索完成');
  } catch {
    message.error('搜索失败');
  } finally {
    loading.value = false;
  }
};

const handleReset = () => {
  Object.assign(searchModel, {
    keyword: '',
    courseId: null,
    status: null,
    dateRange: null,
  });
  handleSearch();
};

const handleRefresh = () => {
  handleSearch();
};

const handleCreate = () => {
  message.info('发布作业功能开发中...');
};

const handleView = (record: any) => {
  message.info('查看作业详情功能开发中...');
};

const handleSubmissions = (record: any) => {
  message.info('查看提交情况功能开发中...');
};

const handleDelete = (record: any) => {
  message.success('删除作业成功');
};

const handleBatchDelete = () => {
  if (selectedRowKeys.value.length === 0) {
    message.warning('请选择要删除的作业');
    return;
  }

  dialog.warning({
    title: '批量删除确认',
    content: `确定要删除选中的 ${selectedRowKeys.value.length} 个作业吗？此操作不可恢复。`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        message.success('批量删除成功');
        selectedRowKeys.value = [];
      } catch (error) {
        console.error('Batch delete failed:', error);
      }
    },
  });
};

const handleSelectionChange = (keys: string[], rows: any[]) => {
  selectedRowKeys.value = keys;
};

// 生命周期
onMounted(() => {
  handleSearch();
});
</script>

<style scoped lang="scss">
.homework-management {
  /* 样式可以根据需要添加 */
}
</style>
