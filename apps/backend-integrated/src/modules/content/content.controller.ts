import { Controller, Get, Post, Delete, Param, Query, Body } from '@nestjs/common';
import { ContentService } from './content.service';
import { ListContentsQueryDto } from './dto/list-contents-query.dto';
import { CreateContentDto } from './dto/create-content.dto';

@Controller('contents')
export class ContentController {
  constructor(private readonly service: ContentService) {}

  @Get()
  list(@Query() query: ListContentsQueryDto) {
    return this.service.list(query);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.service.get(id);
  }

  @Post()
  create(@Body() body: CreateContentDto) {
    return this.service.create(body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Get('stats')
  stats() {
    return this.service.stats();
  }

  @Get('recent')
  recent(@Query('limit') limit?: string) {
    return this.service.recent(limit ? Number(limit) : 10);
  }
}
