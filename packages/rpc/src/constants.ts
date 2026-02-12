/**
 * RPC 协议元数据 Key
 */
export const RPC_PROTOCOL_KEY = 'RPC_PROTOCOL';

/**
 * RPC 协议类型
 */
export enum RpcProtocol {
  // 标准 JSON-RPC 2.0 协议 (通常用于浏览器端接口)
  JSON_RPC = 'JSON_RPC',

  // Thrift 二进制协议 (通常用于服务端间通信)
  THRIFT = 'THRIFT',
}
