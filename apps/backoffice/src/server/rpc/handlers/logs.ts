// 基于级别、traceId 的分页检索
export async function search(params: any) {
  // 读取过滤参数与分页
  const level = String(params?.level ?? '');
  const traceId = String(params?.traceId ?? '');
  const page = Math.max(1, Number(params?.page ?? 1));
  const size = Math.min(100, Math.max(1, Number(params?.size ?? 50)));
  return { items: [], page, size, total: 0, level, traceId };
}

// 日志流占位（后续可升级为 SSE 或 WebSocket）
export async function stream() {
  return { ok: true };
}
