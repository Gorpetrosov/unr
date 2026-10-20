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
import { BannersService } from '../banners/banners.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { bannerSchema, bannerUpdateSchema } from '../common/schemas';
import { ZodValidationPipe } from '../common/zod-validation.pipe';

@Controller('api/admin/banners')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.admin, Role.editor)
export class AdminBannersController {
  constructor(private readonly bannersService: BannersService) {}

  @Get()
  async list() {
    const banners = await this.bannersService.listBanners();
    return { banners };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(new ZodValidationPipe(bannerSchema)) body: Parameters<BannersService['createBanner']>[0]
  ) {
    const banner = await this.bannersService.createBanner(body);
    return { banner };
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(bannerUpdateSchema))
    body: Parameters<BannersService['updateBanner']>[1]
  ) {
    const banner = await this.bannersService.updateBanner(id, body);
    return { banner };
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.bannersService.deleteBanner(id);
  }
}
