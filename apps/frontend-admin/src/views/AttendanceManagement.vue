<template>
  <PageContainer
    title="考勤管理"
    description="管理学生考勤记录和统计信息"
    :breadcrumbs="breadcrumbs"
  >
    <template #actions>
      <n-button type="primary" @click="handleBatchAttendance">
        <template #icon>
          <n-icon><checkmark-circle-outline /></n-icon>
        </template>
        批量考勤
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

    <!-- 考勤统计卡片 -->
    <n-grid :cols="3" :x-gap="16" :y-gap="16" style="margin-bottom: 16px">
      <n-grid-item>
        <n-card>
          <div class="stat-item">
            <div class="stat-label">今日应到</div>
            <div class="stat-value">{{ attendanceStats.total }}</div>
          </div>
        </n-card>
      </n-grid-item>
      <n-grid-item>
        <n-card>
          <div class="stat-item">
            <div class="stat-label">实到人数</div>
            <div class="stat-value text-success">{{ attendanceStats.present }}</div>
          </div>
        </n-card>
      </n-grid-item>
      <n-grid-item>
        <n-card>
          <div class="stat-item">
            <div class="stat-label">出勤率</div>
            <div class="stat-value text-warning">{{ attendanceStats.rate }}%</div>
          </div>
        </n-card>
      </n-grid-item>
    </n-grid>

    <!-- 考勤记录表格 -->
    <BaseTable
      :data="attendanceRecords"
      :columns="columns"
      :loading="loading"
      :pagination="pagination"
      row-key="id"
      selectable
      @select="handleSelectionChange"
    >
      <template #toolbar-left>
        <n-space>
          <n-button type="warning" :disabled="selectedRowKeys.length === 0" @click="handleBatchAbsent">
            <template #icon>
              <n-icon><close-circle-outline /></n-icon>
            </template>
            批量缺勤
          </n-button>
          <n-button :disabled="selectedRowKeys.length === 0" @click="handleExport">
            <template #icon>
              <n-icon><download-outline /></n-icon>
            </template>
            导出记录
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
import { ref, reactive, computed, onMounted } from 'vue';
import { useMessage } from 'naive-ui';
import {
  CheckmarkCircleOutline,
  CloseCircleOutline,
  DownloadOutline,
  RefreshOutline,
} from '@vicons/ionicons5';
import { BaseTable, BaseSearch, PageContainer } from '@/components';
import type { TableColumn, SearchField } from '@/types';

// 状态管理
const message = useMessage();

// 数据状态
const loading = ref(false);
const selectedRowKeys = ref<string[]>([]);

// 搜索表单
const searchModel = reactive({
  keyword: '',
  courseId: null,
  classId: null,
  date: null,
  status: null,
});

const searchFields: SearchField[] = [
  {
    key: 'keyword',
    label: '关键词',
    type: 'input',
    placeholder: '请输入学生姓名或学号',
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
    key: 'classId',
    label: '班级',
    type: 'select',
    placeholder: '请选择班级',
    options: [
      { label: '全部班级', value: null },
      { label: '计科2101', value: 1 },
      { label: '计科2102', value: 2 },
    ],
  },
  {
    key: 'date',
    label: '日期',
    type: 'date',
  },
  {
    key: 'status',
    label: '状态',
    type: 'select',
    options: [
      { label: '全部状态', value: null },
      { label: '出勤', value: 1 },
      { label: '缺勤', value: 0 },
      { label: '请假', value: 2 },
      { label: '迟到', value: 3 },
    ],
  },
];

// 考勤统计
const attendanceStats = reactive({
  total: 120,
  present: 110,
  rate: 91.7,
});

// 模拟考勤数据
const attendanceRecords = ref([
  {
    id: 1,
    studentId: '20210101001',
    studentName: '张三',
    courseName: '数据结构',
    className: '计科2101',
    date: '2024-01-15',
    time: '08:00',
    status: 1,
    location: '教学楼A101',
    teacherName: '李教授',
  },
  {
    id: 2,
    studentId: '20210101002',
    studentName: '李四',
    courseName: '数据结构',
    className: '计科2101',
    date: '2024-01-15',
    time: '08:05',
    status: 3, // 迟到
    location: '教学楼A101',
    teacherName: '李教授',
  },
]);

// 表格列配置
const columns: TableColumn[] = [
  {
    key: 'studentId',
    title: '学号',
    width: 120,
    sortable: true,
  },
  {
    key: 'studentName',
    title: '学生姓名',
    width: 100,
    sortable: true,
  },
  {
    key: 'courseName',
    title: '课程名称',
    width: 150,
  },
  {
    key: 'className',
    title: '班级',
    width: 100,
  },
  {
    key: 'date',
    title: '日期',
    width: 120,
    sortable: true,
  },
  {
    key: 'time',
    title: '时间',
    width: 80,
  },
  {
    key: 'status',
    title: '状态',
    width: 80,
    render: (value: number) => {
      const statusMap = {
        0: { label: '缺勤', type: 'error' },
        1: { label: '出勤', type: 'success' },
        2: { label: '请假', type: 'warning' },
        3: { label: '迟到', type: 'info' },
      };
      const status = statusMap[value as keyof typeof statusMap];
      return <n-tag type={status.type} size="small">{status.label}</n-tag>;
    },
  },
  {
    key: 'location',
    title: '地点',
    width: 120,
  },
  {
    key: 'teacherName',
    title: '授课教师',
    width: 100,
  },
  {
    key: 'actions',
    title: '操作',
    width: 120,
    render: (value: any, record: any) => {
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
              default: () => '确定要删除该考勤记录吗？',
            }}
          </n-popconfirm>
        </n-space>
      );
    },
  },
];

// 面包屑
const breadcrumbs = computed(() => [
  { label: '首页', path: '/' },
  { label: '考勤管理' },
]);

const pagination = computed(() => ({
  current: 1,
  pageSize: 10,
  total: attendanceRecords.value.length,
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
  } catch (error) {
    message.error('搜索失败');
  } finally {
    loading.value = false;
  }
};

const handleReset = () => {
  Object.assign(searchModel, {
    keyword: '',
    courseId: null,
    classId: null,
    date: null,
    status: null,
  });
  handleSearch();
};

const handleRefresh = () => {
  handleSearch();
};

const handleBatchAttendance = () => {
  message.info('批量考勤功能开发中...');
};

const handleBatchAbsent = () => {
  if (selectedRowKeys.value.length === 0) {
    message.warning('请选择要标记缺勤的记录');
    return;
  }
  message.success(`已批量标记 ${selectedRowKeys.value.length} 条记录为缺勤`);
};

const handleExport = () => {
  message.info('导出功能开发中...');
};

const handleEdit = (record: any) => {
  message.info('编辑功能开发中...');
};

const handleDelete = (record: any) => {
  message.success('删除成功');
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
.attendance-management {
  .text-success {
    color: #52c41a;
  }

  .text-warning {
    color: #faad14;
  }
}
</style>