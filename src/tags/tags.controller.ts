import { Controller, Get } from '@nestjs/common';
import { TagsService } from './tags.service';

@Controller('api/tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Get()
  async list() {
    const tags = await this.tagsService.listTags();
    return { tags };
  }
}
