import * as controller from './i18n.controller';

export const domain = 'i18n';
export const handlers = {
  listNamespaces: controller.listNamespaces,
  listEntries: controller.listEntries,
  importEntries: controller.importEntries,
  exportEntries: controller.exportEntries,
};

export const schemas = {
  listNamespaces: {
    summary: '列出命名空间（占位）',
    params: '{}',
    result: '{ items: string[] }',
  },
  listEntries: {
    summary: '分页列出词条（占位）',
    params: '{ namespace:string, page?:number, size?:number }',
    result: '{ items[], page, size, total, namespace }',
  },
  importEntries: {
    summary: '导入（占位）',
    params: '{}',
    result: '{ ok: boolean }',
  },
  exportEntries: {
    summary: '导出（占位）',
    params: '{}',
    result: '{ items: any[] }',
  },
};
