import * as controller from './auth.controller';

export const domain = 'auth';
export const handlers = {
  me: controller.me,
  authorize: controller.authorize,
};

export const schemas = {
  me: {
    summary: '当前用户信息',
    params: '{}',
    result: '{ user: { username, roles[] } }',
  },
  authorize: {
    summary: '发起 OIDC 授权',
    params: 'AuthorizationRequest',
    result: 'AuthorizationInitResult',
  },
};
