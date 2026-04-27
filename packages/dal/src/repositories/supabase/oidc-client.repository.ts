import { SupabaseDataAccess } from '@csisp/supabase-sdk';

// eslint-disable-next-line no-restricted-imports
import type {
  OidcClientRow,
  OidcClientInsert,
  OidcClientUpdate,
} from '../../types';

export class SupabaseOidcClientRepository {
  constructor(private readonly sda: SupabaseDataAccess) {}

  async findByClientId(clientId: string): Promise<OidcClientRow | null> {
    const { data } = await this.sda
      .service()
      .from('oidc_clients')
      .select('*')
      .eq('client_id', clientId)
      .maybeSingle();

    return data;
  }

  async findAll(): Promise<OidcClientRow[]> {
    const { data } = await this.sda.service().from('oidc_clients').select('*');

    return data ?? [];
  }

  /** 查找所有状态为活跃的 OIDC 客户端 */
  async findActiveClients(): Promise<OidcClientRow[]> {
    const { data } = await this.sda
      .service()
      .from('oidc_clients')
      .select('*')
      .eq('status', 1);

    return data ?? [];
  }

  async create(data: OidcClientInsert): Promise<OidcClientRow> {
    const { data: result, error } = await this.sda
      .service()
      .from('oidc_clients')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  async update(
    clientId: string,
    data: Partial<OidcClientUpdate>
  ): Promise<OidcClientRow> {
    const { data: result, error } = await this.sda
      .service()
      .from('oidc_clients')
      .update(data)
      .eq('client_id', clientId)
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  async delete(clientId: string): Promise<void> {
    const { error } = await this.sda
      .service()
      .from('oidc_clients')
      .delete()
      .eq('client_id', clientId);

    if (error) throw error;
  }
}
