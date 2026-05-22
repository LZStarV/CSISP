import {
  checkAuthStatus,
  initiateOAuthLogin,
  setRedirectAfterLogin,
  initOAuthClient,
} from '@csisp/oauth';
import type { Router } from 'vue-router';

import { config } from '@/config';

// 不需要认证的路由
const PUBLIC_ROUTES = ['/callback'];

export function setupAuthGuards(router: Router) {
  router.beforeEach(async to => {
    // 初始化 OAuth 客户端
    initOAuthClient();

    // 检查是否是公开路由
    if (PUBLIC_ROUTES.includes(to.path)) {
      return;
    }

    // 检查认证状态
    const isAuthenticated = await checkAuthStatus();

    if (!isAuthenticated) {
      // 保存用户要访问的路径
      await setRedirectAfterLogin(to.fullPath);
      // 重定向到 OAuth 登录
      await initiateOAuthLogin({
        clientId: config.oauth.clientId,
        redirectUri: config.oauth.redirectUri,
      });
      // 中止当前导航
      return false;
    }
  });
}
