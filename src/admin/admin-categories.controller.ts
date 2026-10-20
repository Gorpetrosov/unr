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
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { CategoriesService } from '../categories/categories.service';
import { LocalizedString } from '../common/helpers';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { categorySchema } from '../common/schemas';
import { ZodValidationPipe } from '../common/zod-validation.pipe';

@Controller('api/admin/categories')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.admin, Role.editor)
export class AdminCategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  async list() {
    const categories = await this.categoriesService.listCategories();
    return { categories };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body(new ZodValidationPipe(categorySchema)) body: { name: LocalizedString }) {
    const category = await this.categoriesService.createCategory(body.name);
    return { category };
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(categorySchema)) body: { name: LocalizedString }
  ) {
    const category = await this.categoriesService.updateCategory(id, body.name);
    return { category };
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.categoriesService.deleteCategory(id);
  }
}
