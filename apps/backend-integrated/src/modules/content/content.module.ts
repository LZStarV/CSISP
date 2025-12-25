import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SequelizePostgresModule } from '@infra/postgres/sequelize.module';
import { ContentController } from './content.controller';
import { ContentService } from './content.service';
import { ContentSchema } from '@infra/mongo/content.schema';

@Module({
  imports: [
    SequelizePostgresModule,
    MongooseModule.forFeature([{ name: 'Content', schema: ContentSchema }]),
  ],
  controllers: [ContentController],
  providers: [ContentService],
  exports: [ContentService],
})
export class ContentModule {}
