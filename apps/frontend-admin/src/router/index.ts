import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';

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
        children: [
          // 临时注释掉系统管理子页面
          // {
          //   path: '/system/roles',
          //   name: 'RoleManagement',
          //   component: () => import('@/pages/course/RoleManagement/index.vue'),
          //   meta: {
          //     title: '角色管理',
          //     icon: 'key',
          //     permission: 'role:read',
          //   },
          // },
          // {
          //   path: '/system/permissions',
          //   name: 'PermissionManagement',
          //   component: () => import('@/pages/course/PermissionManagement/index.vue'),
          //   meta: {
          //     title: '权限管理',
          //     icon: 'lock-closed',
          //     permission: 'permission:read',
          //   },
          // },
        ],
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
  history: createWebHistory((import.meta as any).env.BASE_URL),
  routes,
});

// 路由守卫
// router.beforeEach((to, from, next) => {
//   // 检查是否需要登录
//   if (to.name !== 'Login') {
//     const token = localStorage.getItem('token');
//     if (!token) {
//       next({ name: 'Login' });
//       return;
//     }
//   }

//   // 检查权限
//   if (to.meta.permission) {
//     // 这里可以添加权限检查逻辑
//     // 例如：检查用户是否有相应的权限
//   }

//   next();
// });

export default router;
