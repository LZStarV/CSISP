import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ContentController } from './content.controller';
import { ContentService } from './content.service';
import { PostgresModule } from '@infra/postgres/postgres.module';
import { ContentSchema } from '@infra/mongo/content.schema';

@Module({
  imports: [
    PostgresModule,
    MongooseModule.forFeature([{ name: 'Content', schema: ContentSchema }]),
  ],
  controllers: [ContentController],
  providers: [ContentService],
  exports: [ContentService],
})
export class ContentModule {}
