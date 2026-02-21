import { createRouter, createWebHistory } from 'vue-router';
import type {
  RouteRecordRaw,
  RouteLocationNormalized,
  NavigationGuardNext,
} from 'vue-router';

import { config } from '@/config';
import { useUserStore } from '@/stores';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Layout',
    component: () => import('@/layouts/DefaultLayout.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: '/dashboard',
        name: 'Dashboard',
        component: () => import('@/pages/Dashboard/index.vue'),
        meta: {
          title: '仪表盘',
          icon: 'dashboard',
        },
      },
      {
        path: '/data-overview',
        name: 'DataOverview',
        component: () => import('@/pages/DataOverview/index.vue'),
        meta: {
          title: '数据总览',
          icon: 'analytics',
          permission: 'dashboard:read',
        },
      },
      {
        path: '/users',
        name: 'UserManagement',
        component: () => import('@/pages/UserManagement/index.vue'),
        meta: {
          title: '用户管理',
          icon: 'people',
          permission: 'user:read',
        },
      },
      {
        path: '/courses',
        name: 'CourseManagement',
        component: () => import('@/pages/CourseManagement/index.vue'),
        meta: {
          title: '课程管理',
          icon: 'book',
          permission: 'course:read',
        },
      },
      {
        path: '/attendance',
        name: 'AttendanceManagement',
        component: () => import('@/pages/AttendanceManagement/index.vue'),
        meta: {
          title: '考勤管理',
          icon: 'checkmark-circle',
          permission: 'attendance:read',
        },
      },
      {
        path: '/homework',
        name: 'HomeworkManagement',
        component: () => import('@/pages/HomeworkManagement/index.vue'),
        meta: {
          title: '作业管理',
          icon: 'document-text',
          permission: 'homework:read',
        },
      },
      {
        path: '/notifications',
        name: 'NotificationManagement',
        component: () => import('@/pages/NotificationManagement/index.vue'),
        meta: {
          title: '通知管理',
          icon: 'notifications',
          permission: 'notification:read',
        },
      },
      {
        path: '/system',
        name: 'System',
        redirect: '/system/roles',
        meta: {
          title: '系统管理',
          icon: 'settings',
          permission: 'system:read',
        },
        component: () => import('@/pages/System/index.vue'),
        children: [
          {
            path: 'roles',
            name: 'RoleManagement',
            component: () => import('@/pages/course/RoleManagement/index.vue'),
            meta: {
              title: '角色管理',
              icon: 'key',
              permission: 'role:read',
            },
          },
          {
            path: 'permissions',
            name: 'PermissionManagement',
            component: () =>
              import('@/pages/course/PermissionManagement/index.vue'),
            meta: {
              title: '权限管理',
              icon: 'lock-closed',
              permission: 'permission:read',
            },
          },
        ],
      },
      {
        path: '/profile',
        name: 'Profile',
        component: () => import('@/pages/Profile/index.vue'),
        meta: {
          title: '个人中心',
          icon: 'person',
          hideInMenu: true,
        },
      },
      {
        path: '/password',
        name: 'Password',
        component: () => import('@/pages/Password/index.vue'),
        meta: {
          title: '修改密码',
          icon: 'lock-closed',
          hideInMenu: true,
        },
      },
    ],
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/pages/Login/index.vue'),
    meta: {
      title: '登录',
      hideInMenu: true,
    },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/pages/NotFound/index.vue'),
    meta: {
      title: '404',
      hideInMenu: true,
    },
  },
];

const router = createRouter({
  history: createWebHistory(config.routing.baseUrl),
  routes,
});

router.beforeEach(
  async (
    to: RouteLocationNormalized,
    _from: RouteLocationNormalized,
    next: NavigationGuardNext
  ) => {
    const userStore = useUserStore();

    if (to.name !== 'Login') {
      const token = localStorage.getItem('token');
      if (!token) {
        next({ name: 'Login', query: { redirect: to.fullPath } });
        return;
      }
      if (!userStore.state.currentUser && !userStore.state.loading) {
        try {
          await userStore.getCurrentUser();
        } catch {}
      }
    }

    const requiredPermission = to.meta?.permission as string | undefined;
    const enforcePermissions =
      Array.isArray(userStore.state.permissions) &&
      userStore.state.permissions.length > 0;
    if (requiredPermission && enforcePermissions) {
      const roles = userStore.state.roles || [];
      const permissions = userStore.state.permissions || [];
      const roleNames = Array.isArray(roles)
        ? (roles as any[])
            .map(r => (typeof r === 'string' ? r : (r?.name ?? r?.code ?? '')))
            .filter(Boolean)
        : [];
      const permissionCodes = Array.isArray(permissions)
        ? (permissions as any[])
            .map(p => (typeof p === 'string' ? p : (p?.code ?? p?.name ?? '')))
            .filter(Boolean)
        : [];
      const isAdmin =
        roleNames.includes('admin') ||
        userStore.state.currentUser?.username === 'admin';
      const hasPermission = permissionCodes.includes(requiredPermission);
      if (!isAdmin && !hasPermission) {
        next({ path: '/dashboard' });
        return;
      }
    }

    next();
  }
);

export default router;
