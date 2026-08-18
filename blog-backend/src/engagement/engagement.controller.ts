import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { commentSchema, reactionSchema } from '../common/schemas';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { EngagementService, ReactionType } from './engagement.service';

@Controller('api/articles/:articleId')
export class EngagementController {
  constructor(private readonly engagement: EngagementService) {}

  @Get('comments')
  async comments(@Param('articleId') articleId: string) {
    const comments = await this.engagement.listComments(articleId);
    return { comments };
  }

  @Post('comments')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 8, ttl: 60_000 } })
  async addComment(
    @Param('articleId') articleId: string,
    @Body(new ZodValidationPipe(commentSchema)) body: { authorName: string; body: string }
  ) {
    const comment = await this.engagement.addComment(articleId, body);
    return { comment };
  }

  @Get('reactions')
  reactions(
    @Param('articleId') articleId: string,
    @Query('visitorId') visitorId?: string
  ) {
    return this.engagement.reactionSummary(articleId, visitorId);
  }

  @Post('reactions')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  toggleReaction(
    @Param('articleId') articleId: string,
    @Body(new ZodValidationPipe(reactionSchema)) body: { type: ReactionType; visitorId: string }
  ) {
    return this.engagement.toggleReaction(articleId, body.type, body.visitorId);
  }
}
