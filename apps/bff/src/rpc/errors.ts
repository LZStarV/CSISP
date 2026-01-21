import { err, RPCErrorCode, type RPCID } from './types';

export const InvalidRequest = (id: RPCID, data?: unknown) =>
  err(id, RPCErrorCode.InvalidRequest, 'Invalid Request', data);

export const MethodNotFound = (id: RPCID, data?: unknown) =>
  err(id, RPCErrorCode.MethodNotFound, 'Method Not Found', data);

export const InvalidParams = (id: RPCID, data?: unknown) =>
  err(id, RPCErrorCode.InvalidParams, 'Invalid Params', data);

export const InternalError = (id: RPCID, data?: unknown) =>
  err(id, RPCErrorCode.InternalError, 'Internal Error', data);

export const Unauthorized = (id: RPCID, data?: unknown) =>
  err(id, RPCErrorCode.Unauthorized, 'Unauthorized', data);

export const Forbidden = (id: RPCID, data?: unknown) =>
  err(id, RPCErrorCode.Forbidden, 'Forbidden', data);
