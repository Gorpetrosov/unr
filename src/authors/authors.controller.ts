import { Controller, Get, Param, Query } from '@nestjs/common';
import { ArticlesService } from '../articles/articles.service';

@Controller('api/authors')
export class AuthorsController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Get(':slug')
  get(
    @Param('slug') slug: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    return this.articlesService.listByAuthorSlug(slug, {
      page: Number(page) || 1,
      limit: Number(limit) || 9,
    });
  }
}
