import * as controller from './db.controller';

export const domain = 'db';
export const handlers = {
  listModels: controller.listModels,
  queryTable: controller.queryTable,
};

export const schemas = {
  listModels: {
    summary: '列出可查看模型',
    params: '{}',
    result: '{ models:string[] }',
  },
  queryTable: {
    summary: '按模型进行只读分页查询',
    params:
      '{ table:string, columns?:string[], page?:number, size?:number, orderBy?:string, orderDir?:\"asc\"|\"desc\" }',
    result: '{ items[], page, size, total }',
  },
};
