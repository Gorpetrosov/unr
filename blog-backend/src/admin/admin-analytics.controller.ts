import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AnalyticsService } from '../analytics/analytics.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';

@Controller('api/admin/analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.admin, Role.editor)
export class AdminAnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('stats')
  stats() {
    return this.analyticsService.getDashboardStats();
  }

  @Get('views')
  async views(@Query('days') days?: string) {
    const data = await this.analyticsService.getViewsOverTime(Number(days) || 30);
    return { items: data };
  }

  @Get('shares')
  async shares(@Query('days') days?: string) {
    const data = await this.analyticsService.getSharesByPlatform(Number(days) || 30);
    return { items: data };
  }
}
