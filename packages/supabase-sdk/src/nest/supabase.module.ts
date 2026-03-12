import {
  Global,
  Module,
  type DynamicModule,
  type Provider,
} from '@nestjs/common';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { SupabaseDataAccess } from './data-access';
import { SUPABASE_SERVICE, SUPABASE_USER_FACTORY } from './tokens';

export interface SupabaseModuleOptions {
  url: string;
  serviceRoleKey: string;
  anonKey: string;
}

@Global()
@Module({})
export class SupabaseModule {
  static register(options: SupabaseModuleOptions): DynamicModule {
    const providers: Provider[] = [
      {
        provide: SUPABASE_SERVICE,
        useFactory: (): SupabaseClient =>
          createClient(options.url, options.serviceRoleKey, {
            db: { schema: 'public' },
            auth: { persistSession: false, detectSessionInUrl: false },
          }),
      },
      {
        provide: SUPABASE_USER_FACTORY,
        useFactory: (): ((jwt: string) => SupabaseClient) => {
          return (jwt: string): SupabaseClient =>
            createClient(options.url, options.anonKey, {
              db: { schema: 'public' },
              global: { headers: { Authorization: `Bearer ${jwt}` } },
              auth: { persistSession: false, detectSessionInUrl: false },
            });
        },
      },
      SupabaseDataAccess,
    ];
    return {
      module: SupabaseModule,
      providers,
      exports: providers,
    };
  }
}
