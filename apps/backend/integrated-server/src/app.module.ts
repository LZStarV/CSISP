import { RedisModule } from '@csisp/redis-sdk/nest';
import { SupabaseModule } from '@csisp/supabase-sdk';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { config } from './config';

@Module({
  imports: [
    SupabaseModule.register({
      url: config.supabase.url,
      serviceRoleKey: config.supabase.serviceRoleKey,
      anonKey: config.supabase.anonKey,
    }),
    RedisModule.forRoot({
      url: config.redis.upstash.url,
      token: config.redis.upstash.token,
      namespace: config.redis.namespace,
    }),
    MongooseModule.forRoot(config.mongo.uri),
  ],
})
export class AppModule {}
