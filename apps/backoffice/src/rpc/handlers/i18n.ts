export async function listNamespaces() {
  return { items: [] };
}
export async function listEntries(params: any) {
  const namespace = String(params?.namespace ?? '');
  const page = Math.max(1, Number(params?.page ?? 1));
  const size = Math.min(100, Math.max(1, Number(params?.size ?? 50)));
  return { items: [], page, size, total: 0, namespace };
}
export async function importEntries(_: any) {
  return { ok: true };
}
export async function exportEntries(_: any) {
  return { items: [] };
}
