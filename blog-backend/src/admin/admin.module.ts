import { Module } from '@nestjs/common';
import { AnalyticsModule } from '../analytics/analytics.module';
import { ArticlesModule } from '../articles/articles.module';
import { AuthModule } from '../auth/auth.module';
import { BannersModule } from '../banners/banners.module';
import { CategoriesModule } from '../categories/categories.module';
import { TagsModule } from '../tags/tags.module';
import { AdminAnalyticsController } from './admin-analytics.controller';
import { AdminArticlesController } from './admin-articles.controller';
import { AdminAuthController } from './admin-auth.controller';
import { AdminBannersController } from './admin-banners.controller';
import { AdminCategoriesController } from './admin-categories.controller';
import { AdminTagsController } from './admin-tags.controller';

@Module({
  imports: [AuthModule, ArticlesModule, BannersModule, CategoriesModule, TagsModule, AnalyticsModule],
  controllers: [
    AdminAuthController,
    AdminArticlesController,
    AdminBannersController,
    AdminCategoriesController,
    AdminTagsController,
    AdminAnalyticsController,
  ],
})
export class AdminModule {}
