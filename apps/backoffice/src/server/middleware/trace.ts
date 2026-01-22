export function withTraceId(ctx: Record<string, any>) {
  const existing = ctx.headers?.get?.('x-trace-id') || '';
  const traceId =
    existing || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  ctx.state = ctx.state || {};
  ctx.state.traceId = traceId;
  return { traceId };
}
