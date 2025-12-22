import { Global, Module } from '@nestjs/common';
import { postgresProviders } from './postgres.providers';

@Global()
@Module({
  providers: [...postgresProviders],
  exports: [...postgresProviders],
})
export class PostgresModule {}
