import { Module } from '@nestjs/common';
import { SequelizePostgresModule } from './infra/postgres/sequelize.module';
import { DomainModules } from './modules';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    SequelizePostgresModule,
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017', {
      dbName: process.env.MONGODB_DB || 'csisp',
    }),
    ...DomainModules,
  ],
})
export class AppModule {}
