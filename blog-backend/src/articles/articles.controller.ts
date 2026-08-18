import { Controller, Get, Param, Query, UsePipes } from '@nestjs/common';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { articlesQuerySchema, searchQuerySchema } from '../common/schemas';
import { ArticlesService } from './articles.service';
import { EngagementService } from '../engagement/engagement.service';

@Controller('api/articles')
export class ArticlesController {
  constructor(
    private readonly articlesService: ArticlesService,
    private readonly engagement: EngagementService
  ) {}

  @Get('search')
  @UsePipes(new ZodValidationPipe(searchQuerySchema))
  search(@Query() query: { q: string; page: number; limit: number; category?: string }) {
    return this.articlesService.searchArticles(query);
  }

  @Get()
  @UsePipes(new ZodValidationPipe(articlesQuerySchema))
  list(
    @Query()
    query: {
      page: number;
      limit: number;
      category?: string;
      tag?: string;
      featured?: boolean;
      ids?: string;
    }
  ) {
    return this.articlesService.listPublishedArticles(query);
  }

  @Get(':slug')
  async getBySlug(@Param('slug') slug: string, @Query('visitorId') visitorId?: string) {
    const article = await this.articlesService.getArticleBySlug(slug);
    const record = article as unknown as {
      id: string;
      categories?: Array<{ categoryId: string }>;
      tags?: Array<{ tagId: string }>;
    };

    const [related, comments, reactions] = await Promise.all([
      this.articlesService.getRelatedArticles(
        record.id,
        (record.categories || []).map((c) => c.categoryId),
        (record.tags || []).map((t) => t.tagId)
      ),
      this.engagement.listComments(record.id),
      this.engagement.reactionSummary(record.id, visitorId),
    ]);

    return { article, related, comments, reactions };
  }
}
