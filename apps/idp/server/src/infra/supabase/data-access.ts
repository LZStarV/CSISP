import { Inject, Injectable } from '@nestjs/common';
import type { SupabaseClient } from '@supabase/supabase-js';

import { SUPABASE_SERVICE, SUPABASE_USER_FACTORY } from './tokens';

type SupabaseUserFactory = (jwt: string) => SupabaseClient;

@Injectable()
export class SupabaseDataAccess {
  constructor(
    @Inject(SUPABASE_SERVICE) private readonly serviceClient: SupabaseClient,
    @Inject(SUPABASE_USER_FACTORY)
    private readonly userFactory: SupabaseUserFactory
  ) {}

  service(): SupabaseClient {
    return this.serviceClient;
  }

  user(jwt: string): SupabaseClient {
    return this.userFactory(jwt);
  }

  static unwrap<T>({ data, error }: { data: T | null; error: any }): T {
    if (error) throw error;
    if (data == null) throw new Error('Supabase: data is null');
    return data;
  }
}
