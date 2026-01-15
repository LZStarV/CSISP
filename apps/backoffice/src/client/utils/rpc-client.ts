export async function rpcCall<T>(domain: string, action: string, params: unknown): Promise<T> {
  const res = await fetch(`/api/backoffice/${domain}/${action}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', method: action, params, id: Date.now() }),
  });
  const data = await res.json();
  if (data?.error) {
    const message = String(data.error?.message ?? 'Error');
    throw new Error(message);
  }
  return data.result as T;
}
