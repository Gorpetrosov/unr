import { Body, Controller, Post, Req, UsePipes } from '@nestjs/common';
import { Request } from 'express';
import { getClientIp } from '../common/helpers';
import { shareAnalyticsSchema, viewAnalyticsSchema } from '../common/schemas';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { AnalyticsService } from './analytics.service';

@Controller('api/analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post('view')
  @UsePipes(new ZodValidationPipe(viewAnalyticsSchema))
  trackView(
    @Body() body: { articleId: string; url?: string },
    @Req() req: Request
  ) {
    return this.analyticsService.trackView({
      articleId: body.articleId,
      url: body.url,
      ipAddress: getClientIp(req),
      userAgent: req.get('user-agent') || undefined,
      referrer: req.get('referer') || undefined,
    });
  }

  @Post('share')
  @UsePipes(new ZodValidationPipe(shareAnalyticsSchema))
  trackShare(
    @Body() body: { articleId: string; platform: string },
    @Req() req: Request
  ) {
    return this.analyticsService.trackShare({
      articleId: body.articleId,
      platform: body.platform,
      ipAddress: getClientIp(req),
      userAgent: req.get('user-agent') || undefined,
      referrer: req.get('referer') || undefined,
    });
  }
}
