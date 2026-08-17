import { Controller, Get, Param, Query, UsePipes } from '@nestjs/common';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { articlesQuerySchema, searchQuerySchema } from '../common/schemas';
import { ArticlesService } from './articles.service';

@Controller('api/articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Get('search')
  @UsePipes(new ZodValidationPipe(searchQuerySchema))
  search(@Query() query: { q: string; page: number; limit: number }) {
    return this.articlesService.searchArticles(query);
  }

  @Get()
  @UsePipes(new ZodValidationPipe(articlesQuerySchema))
  list(@Query() query: { page: number; limit: number; category?: string }) {
    return this.articlesService.listPublishedArticles(query);
  }

  @Get(':slug')
  async getBySlug(@Param('slug') slug: string) {
    const article = await this.articlesService.getArticleBySlug(slug);
    return { article };
  }
}
