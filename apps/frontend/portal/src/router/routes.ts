import type { Component } from 'vue';
import type { RouteRecordRaw } from 'vue-router';

import { EXCLUDED_ROUTES } from './exclude';

interface PageModule {
  default: Component;
}

const pageModules = import.meta.glob<PageModule>('/src/pages/**/index.vue', {
  eager: false,
});

const pageRoutes: RouteRecordRaw[] = Object.entries(pageModules)
  .map(([path, mod]) => {
    const routePath = path
      .replace(/^\/src\/pages\//, '/')
      .replace(/\/index\.vue$/, '');

    const routeName = routePath.split('/').filter(Boolean).join('-') || 'Home';

    return {
      path: routePath,
      name: routeName,
      component: () => mod() as Promise<{ default: Component }>,
    };
  })
  .filter(
    route => !EXCLUDED_ROUTES.some(excluded => route.path.startsWith(excluded))
  );

export const routes: RouteRecordRaw[] = [
  ...pageRoutes,
  // 默认路由
  {
    path: '/',
    redirect: '/Demo',
  },
  // 404 路由
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/pages/Error/404.vue'),
  },
];
