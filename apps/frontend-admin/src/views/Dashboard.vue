<template>
  <PageContainer title="仪表盘" description="系统概览和数据统计" :breadcrumbs="breadcrumbs">
    <div class="dashboard">
      <!-- 统计卡片 -->
      <n-grid :cols="4" :x-gap="16" :y-gap="16">
        <n-grid-item>
          <n-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon user">
                <n-icon size="40">
                  <people-outline />
                </n-icon>
              </div>
              <div class="stat-info">
                <div class="stat-number">{{ stats.userCount }}</div>
                <div class="stat-label">总用户数</div>
              </div>
            </div>
          </n-card>
        </n-grid-item>

        <n-grid-item>
          <n-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon course">
                <n-icon size="40">
                  <book-outline />
                </n-icon>
              </div>
              <div class="stat-info">
                <div class="stat-number">{{ stats.courseCount }}</div>
                <div class="stat-label">课程总数</div>
              </div>
            </div>
          </n-card>
        </n-grid-item>

        <n-grid-item>
          <n-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon class">
                <n-icon size="40">
                  <school-outline />
                </n-icon>
              </div>
              <div class="stat-info">
                <div class="stat-number">{{ stats.classCount }}</div>
                <div class="stat-label">班级总数</div>
              </div>
            </div>
          </n-card>
        </n-grid-item>

        <n-grid-item>
          <n-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon attendance">
                <n-icon size="40">
                  <checkmark-circle-outline />
                </n-icon>
              </div>
              <div class="stat-info">
                <div class="stat-number">{{ stats.attendanceRate }}%</div>
                <div class="stat-label">今日出勤率</div>
              </div>
            </div>
          </n-card>
        </n-grid-item>
      </n-grid>

      <!-- 图表区域 -->
      <n-grid :cols="2" :x-gap="16" :y-gap="16" style="margin-top: 16px">
        <n-grid-item>
          <n-card title="用户增长趋势" class="chart-card">
            <div ref="userChartRef" class="chart-container"></div>
          </n-card>
        </n-grid-item>

        <n-grid-item>
          <n-card title="课程分布" class="chart-card">
            <div ref="courseChartRef" class="chart-container"></div>
          </n-card>
        </n-grid-item>
      </n-grid>

      <!-- 最近活动 -->
      <n-card title="最近活动" style="margin-top: 16px">
        <n-list>
          <n-list-item v-for="activity in recentActivities" :key="activity.id">
            <n-thing>
              <template #avatar>
                <n-avatar :style="{ backgroundColor: activity.color }">
                  <n-icon>
                    <component :is="activity.icon" />
                  </n-icon>
                </n-avatar>
              </template>
              <template #header>
                {{ activity.title }}
              </template>
              <template #description>
                {{ activity.time }}
              </template>
              {{ activity.content }}
            </n-thing>
          </n-list-item>
        </n-list>
      </n-card>
    </div>
  </PageContainer>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from 'vue';
import * as echarts from 'echarts';
import { NGrid, NGridItem, NCard, NIcon, NList, NListItem, NThing, NAvatar } from 'naive-ui';
import {
  PeopleOutline,
  BookOutline,
  SchoolOutline,
  CheckmarkCircleOutline,
  PersonAddOutline,
  CreateOutline,
  NotificationsOutline,
} from '@vicons/ionicons5';
import { PageContainer } from '@/components';

// 统计数据
const stats = reactive({
  userCount: 1234,
  courseCount: 56,
  classCount: 128,
  attendanceRate: 92,
});

// 图表引用
const userChartRef = ref<HTMLElement>();
const courseChartRef = ref<HTMLElement>();

// 最近活动
const recentActivities = ref([
  {
    id: 1,
    title: '新用户注册',
    content: '张三同学完成了注册流程',
    time: '2分钟前',
    icon: PersonAddOutline,
    color: '#52c41a',
  },
  {
    id: 2,
    title: '课程创建',
    content: '李教授创建了《数据结构》课程',
    time: '10分钟前',
    icon: CreateOutline,
    color: '#1890ff',
  },
  {
    id: 3,
    title: '系统通知',
    content: '系统将于今晚进行维护升级',
    time: '1小时前',
    icon: NotificationsOutline,
    color: '#faad14',
  },
]);

// 面包屑
const breadcrumbs = ref([{ label: '首页', path: '/' }, { label: '仪表盘' }]);

// 初始化用户增长趋势图表
const initUserChart = () => {
  if (!userChartRef.value) return;

  const chart = echarts.init(userChartRef.value);
  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'axis',
    },
    xAxis: {
      type: 'category',
      data: ['1月', '2月', '3月', '4月', '5月', '6月'],
    },
    yAxis: {
      type: 'value',
    },
    series: [
      {
        name: '用户数',
        type: 'line',
        data: [820, 932, 901, 934, 1290, 1330],
        smooth: true,
        itemStyle: {
          color: '#1890ff',
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(24, 144, 255, 0.3)' },
            { offset: 1, color: 'rgba(24, 144, 255, 0.1)' },
          ]),
        },
      },
    ],
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
  };

  chart.setOption(option);

  // 响应式
  window.addEventListener('resize', () => {
    chart.resize();
  });
};

// 初始化课程分布图表
const initCourseChart = () => {
  if (!courseChartRef.value) return;

  const chart = echarts.init(courseChartRef.value);
  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'item',
    },
    legend: {
      orient: 'vertical',
      left: 'left',
    },
    series: [
      {
        name: '课程分布',
        type: 'pie',
        radius: '50%',
        data: [
          { value: 1048, name: '计算机科学' },
          { value: 735, name: '软件工程' },
          { value: 580, name: '信息安全' },
          { value: 484, name: '人工智能' },
          { value: 300, name: '数据科学' },
        ],
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
      },
    ],
    color: ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1'],
  };

  chart.setOption(option);

  // 响应式
  window.addEventListener('resize', () => {
    chart.resize();
  });
};

// 生命周期
onMounted(async () => {
  await nextTick();
  initUserChart();
  initCourseChart();
});
</script>

<style scoped lang="scss">
.dashboard {
  .stat-card {
    .stat-content {
      display: flex;
      align-items: center;
      gap: 16px;

      .stat-icon {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;

        &.user {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        &.course {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        }

        &.class {
          background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
        }

        &.attendance {
          background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
        }
      }

      .stat-info {
        flex: 1;

        .stat-number {
          font-size: 32px;
          font-weight: 600;
          color: #262626;
          margin-bottom: 4px;
        }

        .stat-label {
          font-size: 14px;
          color: #8c8c8c;
        }
      }
    }
  }

  .chart-card {
    .chart-container {
      height: 300px;
    }
  }
}
</style>
