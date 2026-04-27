import { SupabaseDataAccess } from '@csisp/supabase-sdk';

// eslint-disable-next-line no-restricted-imports
import type {
  MfaSettingsRow,
  MfaSettingsInsert,
  MfaSettingsUpdate,
} from '../../types';

export class SupabaseMfaSettingsRepository {
  constructor(private readonly sda: SupabaseDataAccess) {}

  async findByUserId(userId: number): Promise<MfaSettingsRow | null> {
    const { data } = await this.sda
      .service()
      .from('mfa_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    return data;
  }

  async create(data: MfaSettingsInsert): Promise<MfaSettingsRow> {
    const { data: result, error } = await this.sda
      .service()
      .from('mfa_settings')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  async update(
    userId: number,
    data: Partial<MfaSettingsUpdate>
  ): Promise<MfaSettingsRow> {
    const { data: result, error } = await this.sda
      .service()
      .from('mfa_settings')
      .update(data)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  async upsert(
    userId: number,
    data: MfaSettingsInsert
  ): Promise<MfaSettingsRow> {
    const { data: result, error } = await this.sda
      .service()
      .from('mfa_settings')
      .upsert({ ...data, user_id: userId })
      .select()
      .single();

    if (error) throw error;
    return result;
  }
}
