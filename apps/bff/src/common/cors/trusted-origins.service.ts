import { SupabaseDataAccess } from '@csisp/supabase-sdk';
import {
  BadGatewayException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';

@Injectable()
export class TrustedOriginsService {
  private cached: Set<string> | null = null;
  private expiresAt = 0;
  private readonly ttlMs = 60_000;

  constructor(private readonly sda: SupabaseDataAccess) {}

  private async load(): Promise<Set<string>> {
    const { data, error } = await this.sda
      .service()
      .rpc('bff_get_trusted_frontends');
    if (error) {
      throw new BadGatewayException(error.message);
    }
    if (!Array.isArray(data)) {
      throw new InternalServerErrorException(
        'bff_get_trusted_frontends must return a JSON array of strings'
      );
    }
    const origins: string[] = (data as any[]).map(x => String(x));
    const set = new Set<string>(origins);
    this.cached = set;
    this.expiresAt = Date.now() + this.ttlMs;
    return set;
  }

  async refresh(): Promise<void> {
    await this.load();
  }

  async isAllowed(origin?: string | null): Promise<boolean> {
    if (!origin) return true;
    const now = Date.now();
    if (!this.cached || now >= this.expiresAt) {
      await this.load();
    }
    return this.cached?.has(origin) ?? false;
  }
}
