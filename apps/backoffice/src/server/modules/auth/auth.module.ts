import * as controller from './auth.controller';

export const domain = 'auth';
export const handlers = {
  login: controller.login,
  me: controller.me,
};

export const schemas = {
  login: {
    summary: '管理员登录',
    params: 'username:string, password:string',
    result: 'token:string',
  },
  me: {
    summary: '当前用户信息',
    params: '{}',
    result: '{ user: { username, roles[] } }',
  },
};
