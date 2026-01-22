import {
  internalError,
  invalidParams,
  invalidRequest,
  methodNotFound,
} from '@/src/shared/config/jsonrpc/helpers';
import type { JsonRpcId, RPCResponse } from '@/src/shared/config/jsonrpc/types';

export function wrapError(id: JsonRpcId, e: any): RPCResponse {
  const code = Number(e?.code ?? 0);
  const msg = String(e?.message ?? 'Internal error');
  if (code === -32600) return invalidRequest(id, msg, e?.data);
  if (code === -32601) return methodNotFound(id, msg, e?.data);
  if (code === -32602) return invalidParams(id, msg, e?.data);
  return internalError(id, msg, e?.data);
}
