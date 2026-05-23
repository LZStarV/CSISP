import { SupabaseDataAccess } from '@csisp/supabase-sdk';
import { Global, Module } from '@nestjs/common';

import { SupabaseUserRepository } from './user.repository';

@Global()
@Module({
  providers: [
    {
      provide: SupabaseUserRepository,
      useFactory: (sda: SupabaseDataAccess) => new SupabaseUserRepository(sda),
      inject: [SupabaseDataAccess],
    },
  ],
  exports: [SupabaseUserRepository],
})
export class SupabaseDalModule {}
