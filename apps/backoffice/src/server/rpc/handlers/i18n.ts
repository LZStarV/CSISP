// 列出所有命名空间
export async function listNamespaces() {
  return { items: [] };
}

// 按命名空间分页列出词条
export async function listEntries(params: any) {
  // 读取命名空间与分页参数
  const namespace = String(params?.namespace ?? '');
  const page = Math.max(1, Number(params?.page ?? 1));
  const size = Math.min(100, Math.max(1, Number(params?.size ?? 50)));
  return { items: [], page, size, total: 0, namespace };
}

// 导入占位
export async function importEntries(_: any) {
  return { ok: true };
}

// 导出占位
export async function exportEntries(_: any) {
  return { items: [] };
}
