import { Controller, Get, Param, Post, Query, UsePipes } from '@nestjs/common';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { bannersQuerySchema } from '../common/schemas';
import { BannersService } from './banners.service';

@Controller('api/banners')
export class BannersController {
  constructor(private readonly bannersService: BannersService) {}

  @Get()
  @UsePipes(new ZodValidationPipe(bannersQuerySchema))
  async list(@Query() query: { position?: string }) {
    const banners = await this.bannersService.getActiveBanners(query.position);
    return { banners };
  }

  @Post(':id/click')
  async click(@Param('id') id: string) {
    const banner = await this.bannersService.trackBannerClick(id);
    return { banner };
  }
}
