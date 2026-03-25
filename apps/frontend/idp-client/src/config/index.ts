/**
 * 客户端登录入口配置（改造为服务端跳转端点）
 * - 前端仅持有 client_id 列表，点击时请求服务端执行重定向
 */
export const CLIENT_LOGIN_ENDPOINTS: Record<string, string> = {};

export const config = {
  routes: {
    apiPrefix: '/api/idp',
  },
  login: {
    targets: CLIENT_LOGIN_ENDPOINTS,
  },
};
