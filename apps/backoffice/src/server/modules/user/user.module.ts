import * as controller from './user.controller';

export const domain = 'user';
export const handlers = {
  getUser: controller.get,
  listUsers: controller.list,
};

export const schemas = {
  getUser: {
    summary: '获取用户详情',
    params: '{ id?:number, username?:string }',
    result: '{ id, username, status }',
  },
  listUsers: {
    summary: '分页用户列表',
    params:
      '{ page?:number, size?:number, orderBy?:string, orderDir?:\"asc\"|\"desc\" }',
    result: '{ items[], page, size, total }',
  },
};
