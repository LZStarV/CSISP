<template>
  <PageContainer
    title="通知管理"
    description="发布和管理系统通知公告"
    :breadcrumbs="breadcrumbs"
  >
    <template #actions>
      <n-button type="primary" @click="handleCreate">
        <template #icon>
          <n-icon><add-outline /></n-icon>
        </template>
        发布通知
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

    <!-- 通知表格 -->
    <BaseTable
      :data="notifications"
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
import {
  RefreshOutline,
  AddOutline,
  TrashOutline,
  DownloadOutline,
} from '@vicons/ionicons5';
import { useMessage, useDialog } from 'naive-ui';
import { NTag, NSpace, NButton, NPopconfirm } from 'naive-ui';
import { ref, reactive, computed, onMounted, h } from 'vue';

import { BaseTable, BaseSearch, PageContainer } from '@/components';
import type { TableColumn, SearchField } from '@/types';

// 状态管理
const message = useMessage();
const dialog = useDialog();

// 数据状态
const loading = ref(false);
const selectedRowKeys = ref<string[]>([]);

// 搜索表单
const searchModel = reactive({
  keyword: '',
  type: null,
  status: null,
  dateRange: null,
});

const searchFields: SearchField[] = [
  {
    key: 'keyword',
    label: '关键词',
    type: 'input',
    placeholder: '请输入通知标题或内容',
  },
  {
    key: 'type',
    label: '类型',
    type: 'select',
    options: [
      { label: '全部类型', value: null },
      { label: '系统通知', value: 1 },
      { label: '课程通知', value: 2 },
      { label: '作业通知', value: 3 },
      { label: '考试通知', value: 4 },
    ],
  },
  {
    key: 'status',
    label: '状态',
    type: 'select',
    options: [
      { label: '全部状态', value: null },
      { label: '草稿', value: 0 },
      { label: '已发布', value: 1 },
      { label: '已撤回', value: 2 },
    ],
  },
  {
    key: 'dateRange',
    label: '发布时间',
    type: 'daterange',
  },
];

// 模拟通知数据
const notifications = ref([
  {
    id: 1,
    title: '系统维护通知',
    content: '系统将于今晚22:00-24:00进行维护升级，期间可能影响正常使用。',
    type: 1, // 系统通知
    status: 1, // 已发布
    publisher: '系统管理员',
    publishTime: '2024-01-15 14:30',
    priority: 1, // 高优先级
    readCount: 245,
  },
  {
    id: 2,
    title: '数据结构课程调课通知',
    content: '本周五的数据结构课程调至周三下午，地点不变。',
    type: 2, // 课程通知
    status: 1, // 已发布
    publisher: '李教授',
    publishTime: '2024-01-14 09:15',
    priority: 2, // 中优先级
    readCount: 45,
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
    title: '通知标题',
    width: 300,
    sortable: true,
  },
  {
    key: 'type',
    title: '类型',
    width: 100,
    render: (value: any) => {
      const typeMap = {
        1: { label: '系统通知', type: 'info' },
        2: { label: '课程通知', type: 'success' },
        3: { label: '作业通知', type: 'warning' },
        4: { label: '考试通知', type: 'error' },
      };
      const type = typeMap[value as keyof typeof typeMap];
      return h(
        NTag,
        { type: type.type as any, size: 'small' },
        { default: () => type.label }
      );
    },
  },
  {
    key: 'priority',
    title: '优先级',
    width: 80,
    render: (value: number) => {
      const priorityMap = {
        1: { label: '高', type: 'error' },
        2: { label: '中', type: 'warning' },
        3: { label: '低', type: 'info' },
      };
      const priority = priorityMap[value as keyof typeof priorityMap];
      return h(
        NTag,
        { type: priority.type as any, size: 'small' },
        { default: () => priority.label }
      );
    },
  },
  {
    key: 'publisher',
    title: '发布人',
    width: 120,
  },
  {
    key: 'publishTime',
    title: '发布时间',
    width: 160,
    sortable: true,
  },
  {
    key: 'readCount',
    title: '已读人数',
    width: 100,
    render: (value: number) => `${value}人`,
  },
  {
    key: 'status',
    title: '状态',
    width: 80,
    render: (value: number) => {
      const statusMap = {
        0: { label: '草稿', type: 'default' },
        1: { label: '已发布', type: 'success' },
        2: { label: '已撤回', type: 'warning' },
      };
      const status = statusMap[value as keyof typeof statusMap];
      return h(
        NTag,
        { type: status.type as any, size: 'small' },
        { default: () => status.label }
      );
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
            record.status === 1
              ? h(
                  NButton,
                  {
                    type: 'warning',
                    size: 'small',
                    quaternary: true,
                    onClick: () => handleWithdraw(record),
                  },
                  { default: () => '撤回' }
                )
              : null,
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
                default: () => '确定要删除该通知吗？',
              }
            ),
          ],
        }
      );
    },
  },
];

// 面包屑
const breadcrumbs = computed(() => [
  { label: '首页', path: '/' },
  { label: '通知管理' },
]);

const pagination = computed(() => ({
  current: 1,
  pageSize: 10,
  total: notifications.value.length,
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
    type: null,
    status: null,
    dateRange: null,
  });
  handleSearch();
};

const handleRefresh = () => {
  handleSearch();
};

const handleCreate = () => {
  message.info('发布通知功能开发中...');
};

const handleView = (record: any) => {
  message.info('查看通知详情功能开发中...');
};

const handleWithdraw = (record: any) => {
  dialog.warning({
    title: '撤回确认',
    content: '确定要撤回该通知吗？',
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: () => {
      message.success('通知已撤回');
    },
  });
};

const handleDelete = (record: any) => {
  message.success('删除通知成功');
};

const handleBatchDelete = () => {
  if (selectedRowKeys.value.length === 0) {
    message.warning('请选择要删除的通知');
    return;
  }

  dialog.warning({
    title: '批量删除确认',
    content: `确定要删除选中的 ${selectedRowKeys.value.length} 个通知吗？此操作不可恢复。`,
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
.notification-management {
  /* 样式可以根据需要添加 */
}
</style>
