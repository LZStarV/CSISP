import * as controller from './auth.controller';

export const domain = 'oidc';
export const handlers = {
  userinfo: controller.me,
  authorize: controller.authorize,
  logout: controller.logout,
  revocation: controller.logout,
};

export const schemas = {
  userinfo: {
    summary: '当前用户信息',
    params: '{}',
    result: '{ user: { username, roles[] } }',
  },
  authorize: {
    summary: '发起 OIDC 授权',
    params: 'AuthorizationRequest',
    result: 'AuthorizationInitResult',
  },
  logout: {
    summary: '退出登录',
    params: '{}',
    result: '{ ok: true }',
  },
  revocation: {
    summary: '撤销令牌/退出登录',
    params: '{}',
    result: '{ ok: true }',
  },
};
