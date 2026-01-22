export async function search(params: any) {
  const level = String(params?.level ?? '');
  const traceId = String(params?.traceId ?? '');
  const page = Math.max(1, Number(params?.page ?? 1));
  const size = Math.min(100, Math.max(1, Number(params?.size ?? 50)));
  return { items: [], page, size, total: 0, level, traceId };
}
export async function stream() {
  return { ok: true };
}
