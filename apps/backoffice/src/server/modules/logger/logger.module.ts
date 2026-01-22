import * as controller from './logger.controller';

export const domain = 'logs';
export const handlers = {
  search: controller.search,
  stream: controller.stream,
};

export const schemas = {
  search: {
    summary: '日志查询（占位）',
    params: '{ level?:string, traceId?:string, page?:number, size?:number }',
    result: '{ items[], page, size, total, level, traceId }',
  },
  stream: {
    summary: '日志流（占位）',
    params: '{}',
    result: '{ ok:boolean }',
  },
};
