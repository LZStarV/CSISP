import type { Context, Next } from 'koa';
import type { ZodSchema } from 'zod';

// BFF 响应校验中间件工厂
//
// 典型用法：
// adminRouter.get(
//   '/dashboard/overview',
//   ...,                     // 认证、鉴权、参数校验等中间件
//   validateBffResponse(AdminOverviewResultSchema),
//   controllerFn
// );
//
// 行为：
// - 先执行下游 controller，等待其写入 ctx.body
// - 若状态码为 4xx/5xx 或 body 为空，则跳过校验（认为是错误或未响应）
// - 若 body 形如 { code, message, data }，则只对 data 做 schema.parse 校验
// - 否则直接对整个 body 做 schema.parse
//
// 适用场景：
// - 希望所有对外暴露的 BFF 接口在返回前都经过统一的结构校验
// - schema 作为单一真相，既用于运行时校验，也用于 z.infer 推导 TypeScript 类型
export function validateBffResponse(schema: ZodSchema) {
  return async (ctx: Context, next: Next) => {
    await next();

    // 未设置响应体时不做任何处理
    if (ctx.body === undefined) return;
    // JSON-RPC 响应不做此校验
    if ((ctx.body as any)?.jsonrpc === '2.0') return;
    // 已经是错误响应（4xx/5xx）时跳过校验，交由错误处理中间件统一处理
    if (ctx.status && ctx.status >= 400) return;

    const body: any = ctx.body;

    // 封装形式为 { code, message, data } 时，仅校验 data 字段
    if (body && typeof body === 'object' && 'data' in body) {
      const parsed = schema.parse(body.data);
      ctx.body = { ...body, data: parsed };
      return;
    }

    // 其它情况直接对完整响应体做结构校验
    ctx.body = schema.parse(body);
  };
}
