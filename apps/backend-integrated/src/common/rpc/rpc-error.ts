export class RpcError extends Error {
  readonly id: string | number | null;
  readonly code: number;
  readonly data?: unknown;
  constructor(id: string | number | null, code: number, message: string, data?: unknown) {
    super(message);
    this.id = id;
    this.code = code;
    this.data = data;
  }
}
