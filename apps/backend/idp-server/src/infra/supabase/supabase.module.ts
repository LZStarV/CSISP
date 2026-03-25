import { config } from '@config';
import { Global, Module, Provider } from '@nestjs/common';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { SupabaseDataAccess } from './data-access';
import { GotrueService } from './gotrue.service';
import { SUPABASE_SERVICE, SUPABASE_USER_FACTORY } from './tokens';

const providers: Provider[] = [
  {
    provide: SUPABASE_SERVICE,
    useFactory: (): SupabaseClient => {
      return createClient(config.supabase.url, config.supabase.serviceRoleKey, {
        db: { schema: 'public' },
        auth: { persistSession: false, detectSessionInUrl: false },
      });
    },
  },
  {
    provide: SUPABASE_USER_FACTORY,
    useFactory: (): ((jwt: string) => SupabaseClient) => {
      return (jwt: string): SupabaseClient => {
        return createClient(config.supabase.url, config.supabase.anonKey, {
          db: { schema: 'public' },
          global: { headers: { Authorization: `Bearer ${jwt}` } },
          auth: { persistSession: false, detectSessionInUrl: false },
        });
      };
    },
  },
];

@Global()
@Module({
  providers: [...providers, SupabaseDataAccess, GotrueService],
  exports: [...providers, SupabaseDataAccess, GotrueService],
})
export class SupabaseModule {}
