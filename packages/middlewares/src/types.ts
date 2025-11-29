export type Next = () => Promise<void>;
export interface Context {
  method: string;
  path: string;
  status: number;
  body?: unknown;
  set(header: string, value: string): void;
  get(header: string): string;
  ip: string;
  params?: Record<string, unknown>;
  request?: any;
}
