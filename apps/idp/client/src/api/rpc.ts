import type { JsonRpcResponse } from '@/types/rpc';

export async function call<T>(
  method: string,
  params: unknown
): Promise<JsonRpcResponse<T>> {
  const res = await fetch(`/api/idp/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: '1', params }),
    credentials: 'include',
  });
  return res.json();
}
