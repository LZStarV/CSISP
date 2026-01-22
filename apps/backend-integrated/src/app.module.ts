import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { SequelizePostgresModule } from './infra/postgres/sequelize.module';
import { DomainModules } from './modules';

@Module({
  imports: [
    SequelizePostgresModule,
    MongooseModule.forRoot(
      process.env.MONGODB_URI || 'mongodb://localhost:27017',
      {
        dbName: process.env.MONGODB_DB || 'csisp',
      }
    ),
    ...DomainModules,
  ],
})
export class AppModule {}
