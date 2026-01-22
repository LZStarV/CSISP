import {
  PeopleOutline,
  BookOutline,
  CheckmarkCircleOutline,
} from '@vicons/ionicons5';
import type { EChartsOption } from 'echarts';
import type { Component } from 'vue';
import { markRaw } from 'vue';

import type { UserGrowthData, CourseDistributionData } from '@/api/dashboard';

export interface StatsCardConfig {
  key: string;
  label: string;
  icon: Component;
  suffix?: string;
}

export const defaultStatsCards: StatsCardConfig[] = [
  {
    key: 'users',
    label: '用户总数',
    icon: markRaw(PeopleOutline),
    suffix: '',
  },
  {
    key: 'courses',
    label: '课程总数',
    icon: markRaw(BookOutline),
    suffix: '',
  },
  {
    key: 'attendance',
    label: '平均出勤率',
    icon: markRaw(CheckmarkCircleOutline),
    suffix: '%',
  },
];

export const buildUserGrowthOption = (
  data: UserGrowthData[]
): EChartsOption => {
  const xAxisData = data.map(item => item.date);
  const seriesData = data.map(item => item.count);

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
      },
    },
    xAxis: {
      type: 'category',
      data: xAxisData,
    },
    yAxis: {
      type: 'value',
      name: '用户数',
    },
    series: [
      {
        name: '用户增长',
        type: 'line',
        data: seriesData,
        smooth: true,
        areaStyle: {
          opacity: 0.3,
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
};

export const buildCourseDistributionOption = (
  data: CourseDistributionData[]
): EChartsOption => {
  return {
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
        data,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
      },
    ],
  };
};
