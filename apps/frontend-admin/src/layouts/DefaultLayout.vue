<template>
  <n-layout class="layout-container">
    <!-- 头部 -->
    <n-layout-header bordered class="layout-header">
      <div class="header-left">
        <n-button text @click="toggleSidebar">
          <n-icon size="20">
            <menu-outline />
          </n-icon>
        </n-button>
        <div class="logo">
          <img src="@/assets/logo.svg" alt="CSISP" />
          <span>CSISP 管理系统</span>
        </div>
      </div>
      <div class="header-right">
        <n-space align="center">
          <!-- 通知 -->
          <n-badge :value="unreadCount" :max="99">
            <n-button text @click="handleNotification">
              <n-icon size="20">
                <notifications-outline />
              </n-icon>
            </n-button>
          </n-badge>

          <!-- 全屏 -->
          <n-button text @click="toggleFullscreen">
            <n-icon size="20">
              <expand-outline v-if="!isFullscreen" />
              <contract-outline v-else />
            </n-icon>
          </n-button>

          <!-- 主题切换 -->
          <n-button text @click="toggleTheme">
            <n-icon size="20">
              <sunny-outline v-if="theme === 'dark'" />
              <moon-outline v-else />
            </n-icon>
          </n-button>

          <!-- 用户信息 -->
          <n-dropdown trigger="click" :options="userMenuOptions" @select="handleUserMenuSelect">
            <n-space align="center" style="cursor: pointer">
              <n-avatar :size="32" :src="userAvatar">
                {{ currentUser?.realName?.charAt(0) || 'U' }}
              </n-avatar>
              <span>{{ currentUser?.realName || '用户' }}</span>
              <n-icon size="16">
                <chevron-down-outline />
              </n-icon>
            </n-space>
          </n-dropdown>
        </n-space>
      </div>
    </n-layout-header>

    <n-layout has-sider class="layout-body">
      <!-- 侧边栏 -->
      <n-layout-sider
        bordered
        collapse-mode="width"
        :collapsed-width="64"
        :width="240"
        :collapsed="collapsed"
        show-trigger
        @collapse="handleCollapse"
        @expand="handleExpand"
      >
        <n-menu
          :collapsed="collapsed"
          :collapsed-width="64"
          :collapsed-icon-size="22"
          :options="menuOptions"
          :value="activeKey"
          accordion
          @update:value="handleMenuSelect"
        />
      </n-layout-sider>

      <!-- 主内容区 -->
      <n-layout-content class="layout-content">
        <router-view />
      </n-layout-content>
    </n-layout>
  </n-layout>
</template>

<script setup lang="ts">
import { ref, computed, h, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import {
  NLayout,
  NLayoutHeader,
  NLayoutSider,
  NLayoutContent,
  NMenu,
  NButton,
  NIcon,
  NBadge,
  NSpace,
  NDropdown,
  NAvatar,
  useDialog,
  useMessage,
  type MenuOption,
  type DropdownOption,
} from 'naive-ui';
import {
  MenuOutline,
  NotificationsOutline,
  ExpandOutline,
  ContractOutline,
  SunnyOutline,
  MoonOutline,
  ChevronDownOutline,
  HomeOutline,
  PeopleOutline,
  BookOutline,
  CheckmarkCircleOutline,
  DocumentTextOutline,
  NotificationsCircleOutline,
  SettingsOutline,
  KeyOutline,
  LockClosedOutline,
  LogOutOutline,
  PersonOutline,
} from '@vicons/ionicons5';
import { useUserStore, useAppStore } from '@/stores';
import type { MenuItem } from '@/types';

// 路由
const router = useRouter();
const route = useRoute();

// 状态管理
const userStore = useUserStore();
const appStore = useAppStore();

// UI
const dialog = useDialog();
const message = useMessage();

// 状态
const collapsed = computed(() => appStore.collapsed);
const theme = computed(() => appStore.theme);
const currentUser = computed(() => userStore.state.currentUser);
const isFullscreen = ref(false);

// 菜单配置
const menuItems: MenuItem[] = [
  {
    key: 'dashboard',
    label: '仪表盘',
    icon: 'home',
    path: '/dashboard',
  },
  {
    key: 'users',
    label: '用户管理',
    icon: 'people',
    path: '/users',
    permission: 'user:read',
  },
  {
    key: 'courses',
    label: '课程管理',
    icon: 'book',
    path: '/courses',
    permission: 'course:read',
  },
  {
    key: 'attendance',
    label: '考勤管理',
    icon: 'checkmark-circle',
    path: '/attendance',
    permission: 'attendance:read',
  },
  {
    key: 'homework',
    label: '作业管理',
    icon: 'document-text',
    path: '/homework',
    permission: 'homework:read',
  },
  {
    key: 'notifications',
    label: '通知管理',
    icon: 'notifications',
    path: '/notifications',
    permission: 'notification:read',
  },
  {
    key: 'system',
    label: '系统管理',
    icon: 'settings',
    path: '/system',
    permission: 'system:read',
    children: [
      {
        key: 'system-roles',
        label: '角色管理',
        icon: 'key',
        path: '/system/roles',
        permission: 'role:read',
      },
      {
        key: 'system-permissions',
        label: '权限管理',
        icon: 'lock-closed',
        path: '/system/permissions',
        permission: 'permission:read',
      },
    ],
  },
];

// 图标映射
const iconMap: Record<string, any> = {
  home: HomeOutline,
  people: PeopleOutline,
  book: BookOutline,
  'checkmark-circle': CheckmarkCircleOutline,
  'document-text': DocumentTextOutline,
  notifications: NotificationsCircleOutline,
  settings: SettingsOutline,
  key: KeyOutline,
  'lock-closed': LockClosedOutline,
};

// 菜单选项
const menuOptions = computed<MenuOption[]>(() => {
  const convertMenuItems = (items: MenuItem[]): MenuOption[] => {
    return items.map(item => {
      const option: MenuOption = {
        label: item.label,
        key: item.key,
        icon:
          item.icon && iconMap[item.icon as keyof typeof iconMap]
            ? () => h(NIcon, null, { default: () => h(iconMap[item.icon as keyof typeof iconMap]) })
            : undefined,
      };

      if (item.children) {
        option.children = convertMenuItems(item.children);
      }

      return option;
    });
  };

  return convertMenuItems(menuItems);
});

// 当前激活的菜单项
const activeKey = computed(() => {
  const path = route.path;
  const findActiveKey = (items: MenuItem[]): string | undefined => {
    for (const item of items) {
      if (item.path === path) {
        return item.key;
      }
      if (item.children) {
        const childKey = findActiveKey(item.children);
        if (childKey) return childKey;
      }
    }
    return undefined;
  };
  return findActiveKey(menuItems) || 'dashboard';
});

// 用户菜单选项
const userMenuOptions: DropdownOption[] = [
  {
    label: '个人中心',
    key: 'profile',
    icon: () => h(NIcon, null, { default: () => h(PersonOutline) }),
  },
  {
    label: '修改密码',
    key: 'password',
    icon: () => h(NIcon, null, { default: () => h(LockClosedOutline) }),
  },
  {
    type: 'divider',
    key: 'd1',
  },
  {
    label: '退出登录',
    key: 'logout',
    icon: () => h(NIcon, null, { default: () => h(LogOutOutline) }),
  },
];

// 计算属性
const unreadCount = computed(() => {
  // 这里应该从通知store获取未读数量
  return 0;
});

const userAvatar = computed(() => {
  // 这里应该返回用户头像URL
  return '';
});

// 方法
const toggleSidebar = () => {
  appStore.toggleSidebar();
};

const handleCollapse = () => {
  appStore.setSidebarCollapsed(true);
};

const handleExpand = () => {
  appStore.setSidebarCollapsed(false);
};

const handleMenuSelect = (key: string) => {
  const findPath = (items: MenuItem[]): string | undefined => {
    for (const item of items) {
      if (item.key === key) {
        return item.path;
      }
      if (item.children) {
        const childPath = findPath(item.children);
        if (childPath) return childPath;
      }
    }
    return undefined;
  };

  const path = findPath(menuItems);
  if (path) {
    router.push(path);
  }
};

const handleNotification = () => {
  router.push('/notifications');
};

const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
    isFullscreen.value = true;
  } else {
    document.exitFullscreen();
    isFullscreen.value = false;
  }
};

const toggleTheme = () => {
  const newTheme = theme.value === 'light' ? 'dark' : 'light';
  appStore.setTheme(newTheme);
  // 这里可以添加主题切换的具体逻辑，如修改CSS变量等
};

const handleUserMenuSelect = (key: string) => {
  switch (key) {
    case 'profile':
      router.push('/profile');
      break;
    case 'password':
      router.push('/password');
      break;
    case 'logout':
      handleLogout();
      break;
  }
};

const handleLogout = () => {
  dialog.warning({
    title: '确认退出',
    content: '确定要退出登录吗？',
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await userStore.logout();
        router.push('/login');
        message.success('退出登录成功');
      } catch {
        message.error('退出登录失败');
      }
    },
  });
};

// 生命周期
onMounted(() => {
  // 获取用户信息
  userStore.getCurrentUser();
});
</script>

<style scoped lang="scss">
.layout-container {
  height: 100vh;
  background-color: #f5f5f5;
}

.layout-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  height: 64px;
  background-color: #fff;
  box-shadow: 0 2px 8px rgb(0 0 0 / 6%);

  .header-left {
    display: flex;
    align-items: center;
    gap: 16px;

    .logo {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 18px;
      font-weight: 600;
      color: #262626;

      img {
        width: 32px;
        height: 32px;
      }
    }
  }

  .header-right {
    display: flex;
    align-items: center;
  }
}

.layout-body {
  height: calc(100vh - 64px);
}

.layout-content {
  padding: 0;
  background-color: #f5f5f5;
  overflow: auto;
}

:deep(.n-menu) {
  .n-menu-item-content {
    &.n-menu-item-content--selected {
      background-color: #e6f7ff;
      border-right: 3px solid #1890ff;
    }

    &:hover {
      background-color: #f5f5f5;
    }
  }
}
</style>
