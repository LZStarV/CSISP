<template>
  <PageContainer
    title="仪表盘"
    description="系统概览与数据统计"
    :breadcrumbs="breadcrumbs"
  >
    <template #actions>
      <n-space>
        <n-button @click="fetchDashboardData">
          <template #icon>
            <n-icon><refresh-outline /></n-icon>
          </template>
          刷新数据
        </n-button>
      </n-space>
    </template>

    <!-- 加载状态 -->
    <n-spin :show="loading">
      <!-- 统计卡片 -->
      <n-grid :cols="4" :x-gap="16" :y-gap="16" class="mb-4">
        <n-grid-item v-for="card in statsCards" :key="card.key">
          <n-card>
            <n-statistic :label="card.label" :value="card.value">
              <template #prefix>
                <n-icon :component="card.icon" />
              </template>
              <template #suffix v-if="card.suffix">
                {{ card.suffix }}
              </template>
            </n-statistic>
          </n-card>
        </n-grid-item>
      </n-grid>

      <!-- 图表区域 -->
      <n-grid :cols="2" :x-gap="16" :y-gap="16" class="mb-4">
        <n-grid-item>
          <n-card title="用户增长趋势">
            <div ref="userGrowthChart" style="height: 300px"></div>
          </n-card>
        </n-grid-item>
        <n-grid-item>
          <n-card title="课程分布">
            <div ref="courseDistributionChart" style="height: 300px"></div>
          </n-card>
        </n-grid-item>
      </n-grid>

      <!-- 班级汇总（空板块占位） -->
      <n-card title="班级汇总" class="mb-4">
        <div class="empty-panel">暂无数据</div>
      </n-card>

      <!-- 最近活动 -->
      <n-card title="最近活动">
        <n-timeline>
          <n-timeline-item
            v-for="activity in recentActivities"
            :key="activity.id"
            :type="getActivityType(activity.type)"
            :title="activity.title"
            :content="activity.description"
            :time="formatActivityTime(activity.timestamp)"
          />
        </n-timeline>
      </n-card>
    </n-spin>
  </PageContainer>
</template>

<script setup lang="ts">
import * as echarts from 'echarts';
import { useMessage } from 'naive-ui';
import { ref, reactive, onMounted, onUnmounted, watch } from 'vue';

import {
  defaultStatsCards,
  buildUserGrowthOption,
  buildCourseDistributionOption,
} from './config';
import { getActivityType, formatActivityTime } from './utils';

import { dashboardApi } from '@/api';
import type {
  DashboardStats,
  UserGrowthData,
  CourseDistributionData,
  RecentActivity,
} from '@/api/dashboard';
import { PageContainer } from '@/components';

// 状态管理
const message = useMessage();
const loading = ref(false);

// 面包屑导航
const breadcrumbs = [{ label: '首页', path: '/' }, { label: '仪表盘' }];

// 统计数据
const statsData = reactive<DashboardStats>({
  userCount: 0,
  courseCount: 0,
  attendanceRate: 0,
  homeworkSubmissionRate: 0,
  notificationCount: 0,
});

// 用户增长数据
const userGrowthData = ref<UserGrowthData[]>([]);

// 课程分布数据
const courseDistributionData = ref<CourseDistributionData[]>([]);

// 最近活动数据
const recentActivities = ref<RecentActivity[]>([]);

// 统计卡片配置
const statsCards = ref(
  defaultStatsCards.map(card => ({
    ...card,
    value: 0,
  }))
);

// 图表实例
let userGrowthChartInstance: echarts.ECharts | null = null;
let courseDistributionChartInstance: echarts.ECharts | null = null;

const userGrowthChart = ref<HTMLElement>();
const courseDistributionChart = ref<HTMLElement>();

// 获取仪表盘数据
const fetchDashboardData = async () => {
  try {
    loading.value = true;

    const res = await dashboardApi.getAdminOverview(30, 10);
    const data = res.data;

    if (data) {
      // 统计数据
      Object.assign(statsData, data.stats);
      if (statsCards.value[0]) statsCards.value[0].value = data.stats.userCount;
      if (statsCards.value[1])
        statsCards.value[1].value = data.stats.courseCount;
      if (statsCards.value[2])
        statsCards.value[2].value = data.stats.attendanceRate;

      // 用户增长
      userGrowthData.value = data.userGrowth || [];
      updateUserGrowthChart();

      // 课程分布
      courseDistributionData.value = data.courseDistribution || [];
      updateCourseDistributionChart();

      // 最近活动
      recentActivities.value = data.recentActivities || [];
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : '获取数据失败';
    message.error(msg);
  } finally {
    loading.value = false;
  }
};

// 更新用户增长图表
const updateUserGrowthChart = () => {
  if (!userGrowthChartInstance || !userGrowthData.value.length) return;

  const option = buildUserGrowthOption(userGrowthData.value);
  userGrowthChartInstance.setOption(option);
};

// 更新课程分布图表
const updateCourseDistributionChart = () => {
  if (!courseDistributionChartInstance || !courseDistributionData.value.length)
    return;

  const option = buildCourseDistributionOption(courseDistributionData.value);
  courseDistributionChartInstance.setOption(option);
};

// 初始化图表
onMounted(() => {
  if (userGrowthChart.value) {
    userGrowthChartInstance = echarts.init(userGrowthChart.value);
  }
  if (courseDistributionChart.value) {
    courseDistributionChartInstance = echarts.init(
      courseDistributionChart.value
    );
  }

  fetchDashboardData();
});

// 清理图表实例
onUnmounted(() => {
  if (userGrowthChartInstance) {
    userGrowthChartInstance.dispose();
  }
  if (courseDistributionChartInstance) {
    courseDistributionChartInstance.dispose();
  }
});

// 监听数据变化更新图表
watch([userGrowthData, courseDistributionData], () => {
  updateUserGrowthChart();
  updateCourseDistributionChart();
});
</script>

<style scoped lang="scss">
.dashboard-container {
  padding: 24px;
}

.stats-card {
  text-align: center;

  .n-statistic {
    margin: 0;
  }
}

.chart-container {
  height: 300px;
}
</style>
