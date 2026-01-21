import type { Context } from 'koa';

type Handler = (ctx: Context, params: any) => Promise<any>;
type SubRegistry = Map<string, Handler>; // key: domain.action
const REGISTRY = new Map<string, SubRegistry>(); // key: subProject

export function ensureSubproject(subProject: string) {
  if (!REGISTRY.has(subProject)) REGISTRY.set(subProject, new Map());
  return REGISTRY.get(subProject)!;
}

export function register(subProject: string, method: string, handler: Handler) {
  const sub = ensureSubproject(subProject);
  sub.set(method, handler);
}

export function registerBulk(subProject: string, handlers: Record<string, Handler>) {
  const sub = ensureSubproject(subProject);
  for (const [method, handler] of Object.entries(handlers)) {
    sub.set(method, handler);
  }
}

export function get(subProject: string, method: string): Handler | undefined {
  const sub = REGISTRY.get(subProject);
  return sub?.get(method);
}

export async function call(subProject: string, method: string, ctx: Context, params: any) {
  const h = get(subProject, method);
  if (!h) throw new Error(`Method not found: ${subProject}/${method}`);
  return h(ctx, params);
}

export type { Handler };
