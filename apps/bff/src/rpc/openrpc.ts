import type { Context } from 'koa';
import { z } from 'zod';
import { DomainModules } from '../modules';

function schemaToJson(schema?: z.ZodTypeAny): any {
  if (!schema) return undefined;
  const def: any = (schema as any)._def;
  if (def?.typeName === 'ZodObject') {
    const shape = def.shape();
    const props: Record<string, any> = {};
    for (const k of Object.keys(shape)) {
      const sDef: any = (shape[k] as any)._def;
      props[k] = { typeName: sDef?.typeName };
    }
    return { type: 'object', properties: props };
  }
  return { typeName: def?.typeName ?? 'unknown' };
}

function buildDocFor(subProject: string) {
  const mod = DomainModules.find(m => m.subProject === subProject);
  const methods = mod ? Object.keys(mod.schemas || {}) : [];
  return {
    openrpc: '1.2.6',
    info: { title: `CSISP BFF OpenRPC (${subProject})`, version: '0.1.0' },
    servers: [{ name: `bff-${subProject}`, url: `/api/bff/${subProject}` }],
    methods: methods.map(name => {
      const s = (mod!.schemas as Record<string, any>)[name];
      return {
        name,
        summary: s?.summary,
        description: s?.description,
        params: schemaToJson(s?.params),
        result: schemaToJson(s?.result),
      };
    }),
  };
}

export async function handleOpenRPCAdmin(ctx: Context) {
  ctx.body = buildDocFor('admin');
}

export async function handleOpenRPCPortal(ctx: Context) {
  ctx.body = buildDocFor('portal');
}
