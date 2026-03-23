import { config } from '@config';
import { Injectable } from '@nestjs/common';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class GotrueService {
  private readonly client: SupabaseClient;

  constructor() {
    this.client = createClient(config.supabase.url, config.supabase.anonKey, {
      auth: { persistSession: false, detectSessionInUrl: false },
      db: { schema: 'public' },
    });
  }

  async signInWithPassword(params: {
    email: string;
    password: string;
  }): Promise<void> {
    const { error } = await this.client.auth.signInWithPassword({
      email: params.email,
      password: params.password,
    });
    if (error) {
      throw error;
    }
  }

  async signInWithOtp(params: { email: string }): Promise<void> {
    const { error } = await this.client.auth.signInWithOtp({
      email: params.email,
    });
    if (error) {
      throw error;
    }
  }

  async verifyOtp(params: {
    token_hash: string;
    type: 'email' | 'magiclink';
  }): Promise<void> {
    const { error } = await this.client.auth.verifyOtp({
      token_hash: params.token_hash,
      type: params.type,
    } as any);
    if (error) {
      throw error;
    }
  }
}
