import { modules } from '@/src/server/modules';
export type Handler = (
  params: unknown,
  ctx: Record<string, any>
) => Promise<unknown>;

export const registry: Record<string, Record<string, Handler>> = {};

for (const m of modules) {
  registry[m.domain] = m.handlers as any;
}
