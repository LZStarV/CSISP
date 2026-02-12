export interface SessionStore {
  get(key: string): Promise<any | null>;
  set(key: string, value: any, ttlMs: number): Promise<void>;
  del(key: string): Promise<void>;
}

export class SessionManager {
  constructor(
    private readonly store: SessionStore,
    private readonly prefix: string = 'sess:'
  ) {}

  async create(token: string, user: any, ttlMs: number): Promise<void> {
    await this.store.set(this.prefix + token, user, ttlMs);
  }

  async get(token: string): Promise<any | null> {
    return this.store.get(this.prefix + token);
  }

  async destroy(token: string): Promise<void> {
    await this.store.del(this.prefix + token);
  }
}
