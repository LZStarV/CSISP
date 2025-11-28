<template>
  <PageContainer
    title="数据总览"
    description="查看系统所有核心数据的汇总信息"
    :breadcrumbs="breadcrumbs"
  >
    <template #actions>
      <n-space>
        <n-button @click="handleRefresh">
          <template #icon>
            <n-icon><refresh-outline /></n-icon>
          </template>
          刷新数据
        </n-button>
        <n-button type="primary" @click="handleExport">
          <template #icon>
            <n-icon><download-outline /></n-icon>
          </template>
          导出报告
        </n-button>
      </n-space>
    </template>

    <!-- 加载状态 -->
    <n-spin :show="loading">
      <!-- 错误提示 -->
      <n-alert
        v-if="error"
        type="error"
        :title="error"
        class="mb-4"
        closable
        @close="error = null"
      />

      <!-- 数据概览卡片 -->
      <n-grid :cols="4" :x-gap="16" :y-gap="16" class="mb-4">
        <n-grid-item v-for="card in overviewCards" :key="card.key">
          <n-card class="overview-card" :class="card.class">
            <div class="card-content">
              <div class="card-icon">
                <n-icon size="32">
                  <component :is="card.icon" />
                </n-icon>
              </div>
              <div class="card-info">
                <div class="card-number">{{ formatNumber(card.value) }}</div>
                <div class="card-label">{{ card.label }}</div>
                <div v-if="card.trend" class="card-trend" :class="card.trend > 0 ? 'up' : 'down'">
                  <n-icon size="12">
                    <component :is="card.trend > 0 ? ArrowUpOutline : ArrowDownOutline" />
                  </n-icon>
                  {{ Math.abs(card.trend) }}%
                </div>
              </div>
            </div>
          </n-card>
        </n-grid-item>
      </n-grid>

      <!-- 详细数据表格 -->
      <n-tabs v-model:value="activeTab" type="line">
        <n-tab-pane name="users" tab="用户数据">
          <n-data-table
            :columns="userColumns"
            :data="userData"
            :loading="loading"
            :pagination="userPagination"
            :row-key="(row: any) => row.id"
            size="small"
          />
        </n-tab-pane>

        <n-tab-pane name="courses" tab="课程数据">
          <n-data-table
            :columns="courseColumns"
            :data="courseData"
            :loading="loading"
            :pagination="coursePagination"
            :row-key="(row: any) => row.id"
            size="small"
          />
        </n-tab-pane>

        <n-tab-pane name="attendance" tab="考勤数据">
          <n-space vertical>
            <n-form inline :model="attendanceQuery">
              <n-form-item label="课程">
                <n-select
                  v-model:value="attendanceQuery.courseId"
                  placeholder="选择课程"
                  :options="courseOptions"
                  clearable
                  style="width: 200px"
                />
              </n-form-item>
              <n-form-item label="日期范围">
                <n-date-picker
                  v-model:value="attendanceQuery.dateRange"
                  type="daterange"
                  clearable
                />
              </n-form-item>
              <n-form-item>
                <n-button @click="fetchAttendanceData">查询</n-button>
              </n-form-item>
            </n-form>

            <n-data-table
              :columns="attendanceColumns"
              :data="attendanceData"
              :loading="loading"
              :pagination="attendancePagination"
              :row-key="(row: any) => row.id"
              size="small"
            />
          </n-space>
        </n-tab-pane>

        <n-tab-pane name="homework" tab="作业数据">
          <n-data-table
            :columns="homeworkColumns"
            :data="homeworkData"
            :loading="loading"
            :pagination="homeworkPagination"
            :row-key="(row: any) => row.id"
            size="small"
          />
        </n-tab-pane>
      </n-tabs>
    </n-spin>
  </PageContainer>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, h, markRaw } from 'vue';
import { useMessage } from 'naive-ui';
import {
  PeopleOutline,
  BookOutline,
  SchoolOutline,
  CheckmarkCircleOutline,
  DocumentTextOutline,
  RefreshOutline,
  DownloadOutline,
  ArrowUpOutline,
  ArrowDownOutline,
} from '@vicons/ionicons5';
import { PageContainer } from '@/components';
import { dashboardApi, userApi, courseApi, attendanceApi, homeworkApi } from '@/api';
import type { DataTableColumns } from 'naive-ui';
import type { User, Course, AttendanceRecord, Homework } from '@csisp/types';

// 状态管理
const message = useMessage();
const loading = ref(false);
const error = ref<string | null>(null);

// 当前激活的标签页
const activeTab = ref('users');

// 面包屑导航
const breadcrumbs = [{ label: '首页', path: '/' }, { label: '数据总览' }];

// 概览卡片数据
const overviewCards = ref([
  {
    key: 'users',
    label: '用户总数',
    value: 0,
    trend: 0,
    icon: markRaw(PeopleOutline),
    class: 'users-card',
  },
  {
    key: 'courses',
    label: '课程总数',
    value: 0,
    trend: 0,
    icon: markRaw(BookOutline),
    class: 'courses-card',
  },
  {
    key: 'classes',
    label: '班级总数',
    value: 0,
    trend: 0,
    icon: markRaw(SchoolOutline),
    class: 'classes-card',
  },
  {
    key: 'attendance',
    label: '平均出勤率',
    value: 0,
    trend: 0,
    icon: markRaw(CheckmarkCircleOutline),
    class: 'attendance-card',
  },
]);

// 表格数据
const userData = ref<User[]>([]);
const courseData = ref<Course[]>([]);
const attendanceData = ref<any[]>([]);
const homeworkData = ref<Homework[]>([]);

// 课程选项（用于考勤查询）
const courseOptions = ref<any[]>([]);

// 查询条件
const attendanceQuery = reactive({
  courseId: null as number | null,
  dateRange: null as any,
});

// 用户表格列定义
const userColumns: DataTableColumns<User> = [
  {
    title: 'ID',
    key: 'id',
    width: 80,
  },
  {
    title: '姓名',
    key: 'realName',
    width: 120,
  },
  {
    title: '学号',
    key: 'studentId',
    width: 120,
  },
  {
    title: '用户名',
    key: 'username',
    width: 120,
  },
  {
    title: '邮箱',
    key: 'email',
    width: 200,
  },
  {
    title: '角色',
    key: 'role',
    width: 100,
    render: (row: any) => {
      const roleMap = {
        admin: { text: '管理员', type: 'error' },
        student: { text: '学生', type: 'info' },
        course_rep: { text: '课代表', type: 'warning' },
        student_cadre: { text: '学生干部', type: 'success' },
      };
      const role = roleMap[row.role as keyof typeof roleMap] || { text: '未知', type: 'default' };
      return h('n-tag', { type: role.type as any }, role.text);
    },
  },
  {
    title: '状态',
    key: 'status',
    width: 80,
    render: (row: any) => {
      return h(
        'n-tag',
        { type: row.status === 'active' ? 'success' : 'error' },
        row.status === 'active' ? '正常' : '禁用'
      );
    },
  },
  {
    title: '创建时间',
    key: 'createdAt',
    width: 180,
    render: (row: any) => new Date(row.createdAt).toLocaleString('zh-CN'),
  },
];

// 课程表格列定义
const courseColumns: DataTableColumns<Course> = [
  {
    title: 'ID',
    key: 'id',
    width: 80,
  },
  {
    title: '课程名称',
    key: 'courseName',
    width: 200,
  },
  {
    title: '课程代码',
    key: 'courseCode',
    width: 120,
  },
  {
    title: '学分',
    key: 'credits',
    width: 80,
  },
  {
    title: '教师',
    key: 'teacherName',
    width: 120,
    render: (row: any) => row.teacher?.realName || '-',
  },
  {
    title: '状态',
    key: 'status',
    width: 80,
    render: (row: any) => {
      return h(
        'n-tag',
        { type: row.status === 'active' ? 'success' : 'error' },
        row.status === 'active' ? '正常' : '禁用'
      );
    },
  },
  {
    title: '创建时间',
    key: 'createdAt',
    width: 180,
    render: (row: any) => new Date(row.createdAt).toLocaleString('zh-CN'),
  },
];

// 考勤表格列定义
const attendanceColumns: DataTableColumns<any> = [
  {
    title: 'ID',
    key: 'id',
    width: 80,
  },
  {
    title: '学生',
    key: 'studentName',
    width: 120,
    render: (row: any) => '-', // 需要根据实际数据结构调整
  },
  {
    title: '学号',
    key: 'studentId',
    width: 120,
    render: (row: any) => '-', // 需要根据实际数据结构调整
  },
  {
    title: '课程',
    key: 'courseName',
    width: 150,
    render: (row: any) => '-', // 需要根据实际数据结构调整
  },
  {
    title: '考勤状态',
    key: 'status',
    width: 100,
    render: (row: any) => {
      const statusMap = {
        normal: { text: '正常', type: 'success' },
        late: { text: '迟到', type: 'warning' },
        absent: { text: '缺勤', type: 'error' },
        leave: { text: '请假', type: 'info' },
        not_checked: { text: '未打卡', type: 'default' },
      };
      const status = statusMap[row.status as keyof typeof statusMap] || {
        text: '未知',
        type: 'default',
      };
      return h('n-tag', { type: status.type as any }, status.text);
    },
  },
  {
    title: '打卡时间',
    key: 'createdAt',
    width: 180,
    render: (row: any) => (row.createdAt ? new Date(row.createdAt).toLocaleString('zh-CN') : '-'),
  },
  {
    title: '备注',
    key: 'remark',
    width: 150,
  },
];

// 作业表格列定义
const homeworkColumns: DataTableColumns<Homework> = [
  {
    title: 'ID',
    key: 'id',
    width: 80,
  },
  {
    title: '作业标题',
    key: 'title',
    width: 200,
  },
  {
    title: '课程',
    key: 'courseName',
    width: 150,
    render: (row: any) => '-', // 需要根据实际数据结构调整
  },
  {
    title: '发布者',
    key: 'publisherName',
    width: 120,
    render: (row: any) => '-', // 需要根据实际数据结构调整
  },
  {
    title: '截止时间',
    key: 'deadline',
    width: 180,
    render: (row: any) => new Date(row.deadline).toLocaleString('zh-CN'),
  },
  {
    title: '状态',
    key: 'status',
    width: 100,
    render: (row: any) => {
      const now = new Date();
      const deadline = new Date(row.deadline);
      const isOverdue = now > deadline;

      if (isOverdue) {
        return h('n-tag', { type: 'error' }, '已截止');
      } else {
        return h('n-tag', { type: 'success' }, '进行中');
      }
    },
  },
  {
    title: '提交数量',
    key: 'submissionCount',
    width: 100,
    render: (row: any) => '-', // 需要根据实际数据结构调整
  },
  {
    title: '创建时间',
    key: 'createdAt',
    width: 180,
    render: (row: any) => new Date(row.createdAt).toLocaleString('zh-CN'),
  },
];

// 分页配置
const userPagination = reactive({
  page: 1,
  pageSize: 20,
  showSizePicker: true,
  pageSizes: [10, 20, 50, 100],
  itemCount: 0,
  onChange: (page: number) => {
    userPagination.page = page;
    fetchDetailedData();
  },
  onUpdatePageSize: (pageSize: number) => {
    userPagination.pageSize = pageSize;
    userPagination.page = 1;
    fetchDetailedData();
  },
});

const coursePagination = reactive({
  page: 1,
  pageSize: 20,
  showSizePicker: true,
  pageSizes: [10, 20, 50, 100],
  itemCount: 0,
  onChange: (page: number) => {
    coursePagination.page = page;
    fetchDetailedData();
  },
  onUpdatePageSize: (pageSize: number) => {
    coursePagination.pageSize = pageSize;
    coursePagination.page = 1;
    fetchDetailedData();
  },
});

const attendancePagination = reactive({
  page: 1,
  pageSize: 20,
  showSizePicker: true,
  pageSizes: [10, 20, 50, 100],
  itemCount: 0,
  onChange: (page: number) => {
    attendancePagination.page = page;
    fetchAttendanceData();
  },
  onUpdatePageSize: (pageSize: number) => {
    attendancePagination.pageSize = pageSize;
    attendancePagination.page = 1;
    fetchAttendanceData();
  },
});

const homeworkPagination = reactive({
  page: 1,
  pageSize: 20,
  showSizePicker: true,
  pageSizes: [10, 20, 50, 100],
  itemCount: 0,
  onChange: (page: number) => {
    homeworkPagination.page = page;
    fetchDetailedData();
  },
  onUpdatePageSize: (pageSize: number) => {
    homeworkPagination.pageSize = pageSize;
    homeworkPagination.page = 1;
    fetchDetailedData();
  },
});

// 获取数据概览
const fetchOverviewData = async () => {
  try {
    loading.value = true;
    error.value = null;

    // 并行获取概览数据
    const [statsResponse, usersResponse, coursesResponse] = await Promise.allSettled([
      dashboardApi.getDashboardStats(),
      userApi.getUsers({ page: 1, pageSize: 1 }),
      courseApi.getCourses({ page: 1, pageSize: 1 }),
    ]);

    // 更新概览卡片
    if (statsResponse.status === 'fulfilled' && statsResponse.value.data) {
      const stats = statsResponse.value.data;
      if (overviewCards.value[0]) overviewCards.value[0].value = stats.userCount;
      if (overviewCards.value[1]) overviewCards.value[1].value = stats.courseCount;
      if (overviewCards.value[2]) overviewCards.value[2].value = stats.classCount;
      if (overviewCards.value[3]) overviewCards.value[3].value = stats.attendanceRate;
    }

    // 获取详细数据
    await fetchDetailedData();
  } catch (err) {
    error.value = err instanceof Error ? err.message : '获取数据失败';
    console.error('Failed to fetch overview data:', err);
  } finally {
    loading.value = false;
  }
};

// 获取详细数据
const fetchDetailedData = async () => {
  try {
    // 获取用户数据
    const usersResponse = await userApi.getUsers({
      page: userPagination.page,
      pageSize: userPagination.pageSize,
    });
    userData.value = usersResponse.data?.data || [];
    userPagination.itemCount = usersResponse.data?.total || 0;

    // 获取课程数据
    const coursesResponse = await courseApi.getCourses({
      page: coursePagination.page,
      pageSize: coursePagination.pageSize,
    });
    courseData.value = coursesResponse.data?.data || [];
    coursePagination.itemCount = coursesResponse.data?.total || 0;

    // 获取课程选项（用于考勤查询）
    const allCoursesResponse = await courseApi.getCourses({ pageSize: 100 });
    courseOptions.value = (allCoursesResponse.data?.data || []).map((course: any) => ({
      label: course.courseName,
      value: course.id,
    }));

    // 获取考勤数据
    await fetchAttendanceData();

    // 获取作业数据
    const homeworkResponse = await homeworkApi.getHomeworks({
      page: homeworkPagination.page,
      pageSize: homeworkPagination.pageSize,
    });
    homeworkData.value = homeworkResponse.data?.data || [];
    homeworkPagination.itemCount = homeworkResponse.data?.total || 0;
  } catch (err) {
    error.value = err instanceof Error ? err.message : '获取详细数据失败';
    console.error('Failed to fetch detailed data:', err);
  }
};

// 获取考勤数据
const fetchAttendanceData = async () => {
  try {
    const params: any = {
      page: attendancePagination.page,
      pageSize: attendancePagination.pageSize,
    };

    if (attendanceQuery.courseId) {
      params.courseId = attendanceQuery.courseId;
    }

    if (
      attendanceQuery.dateRange &&
      Array.isArray(attendanceQuery.dateRange) &&
      attendanceQuery.dateRange.length === 2
    ) {
      params.startDate = new Date(attendanceQuery.dateRange[0]).toISOString();
      params.endDate = new Date(attendanceQuery.dateRange[1]).toISOString();
    }

    const attendanceResponse = await attendanceApi.getAttendanceRecords(params);
    attendanceData.value = attendanceResponse.data?.data || [];
    attendancePagination.itemCount = attendanceResponse.data?.total || 0;
  } catch (err) {
    error.value = err instanceof Error ? err.message : '获取考勤数据失败';
    console.error('Failed to fetch attendance data:', err);
  }
};

// 格式化数字
const formatNumber = (num: number): string => {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万';
  }
  return num.toString();
};

// 刷新数据
const handleRefresh = () => {
  fetchOverviewData();
};

// 导出报告
const handleExport = () => {
  message.success('数据导出功能开发中...');
};

// 组件挂载时获取数据
onMounted(() => {
  fetchOverviewData();
});
</script>

<style scoped lang="scss">
.overview-card {
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgb(0 0 0 / 10%);
  }

  .card-content {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .card-icon {
    color: var(--n-color-target);
  }

  .card-info {
    flex: 1;
  }

  .card-number {
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 4px;
  }

  .card-label {
    font-size: 14px;
    color: #666;
    margin-bottom: 4px;
  }

  .card-trend {
    font-size: 12px;
    display: flex;
    align-items: center;
    gap: 4px;

    &.up {
      color: #18a058;
    }

    &.down {
      color: #d03050;
    }
  }
}

.users-card {
  .card-icon {
    color: #2080f0;
  }
}

.courses-card {
  .card-icon {
    color: #f0a020;
  }
}

.classes-card {
  .card-icon {
    color: #18a058;
  }
}

.attendance-card {
  .card-icon {
    color: #d03050;
  }
}
</style>
