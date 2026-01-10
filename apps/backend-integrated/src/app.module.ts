import { Module } from '@nestjs/common';
import { HealthModule } from '@modules/health/health.module';
import { SequelizePostgresModule } from '@infra/postgres/sequelize.module';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    SequelizePostgresModule,
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017', {
      dbName: process.env.MONGODB_DB || 'csisp',
    }),
    HealthModule,
  ],
})
export class AppModule {}
