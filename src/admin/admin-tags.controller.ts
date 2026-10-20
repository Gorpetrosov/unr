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
import { LocalizedString } from '../common/helpers';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { tagSchema } from '../common/schemas';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { TagsService } from '../tags/tags.service';

@Controller('api/admin/tags')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.admin, Role.editor)
export class AdminTagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Get()
  async list() {
    const tags = await this.tagsService.listTags();
    return { tags };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body(new ZodValidationPipe(tagSchema)) body: { name: LocalizedString }) {
    const tag = await this.tagsService.createTag(body.name);
    return { tag };
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(tagSchema)) body: { name: LocalizedString }
  ) {
    const tag = await this.tagsService.updateTag(id, body.name);
    return { tag };
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tagsService.deleteTag(id);
  }
}
