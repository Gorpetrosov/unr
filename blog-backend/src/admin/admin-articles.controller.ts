import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { ArticlesService } from '../articles/articles.service';
import { AuthPayload, CurrentUser } from '../common/current-user.decorator';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { articleCreateSchema, articleUpdateSchema } from '../common/schemas';
import { ZodValidationPipe } from '../common/zod-validation.pipe';

@Controller('api/admin/articles')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.admin, Role.editor)
export class AdminArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Get()
  list(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string
  ) {
    return this.articlesService.listAdminArticles({
      page: Number(page) || 1,
      limit: Number(limit) || 20,
      status,
    });
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    const article = await this.articlesService.getAdminArticle(id);
    return { article };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: AuthPayload,
    @Body(new ZodValidationPipe(articleCreateSchema)) body: Record<string, unknown>
  ) {
    const article = await this.articlesService.createArticle(
      user.userId,
      body as Parameters<ArticlesService['createArticle']>[1]
    );
    return { article };
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(articleUpdateSchema)) body: Record<string, unknown>
  ) {
    const article = await this.articlesService.updateArticle(
      id,
      body as Parameters<ArticlesService['updateArticle']>[1]
    );
    return { article };
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Query('hard') hard?: string) {
    return this.articlesService.deleteArticle(id, hard === 'true');
  }
}