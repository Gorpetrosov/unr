import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import {
  newsletterSubscribeSchema,
  newsletterTokenSchema,
  newsletterUnsubscribeEmailSchema,
} from '../common/schemas';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { NewsletterService } from './newsletter.service';

@Controller('api/newsletter')
export class NewsletterController {
  constructor(private readonly newsletter: NewsletterService) {}

  @Post('subscribe')
  @HttpCode(HttpStatus.ACCEPTED)
  @Throttle({ default: { limit: 8, ttl: 60_000 } })
  subscribe(
    @Body(new ZodValidationPipe(newsletterSubscribeSchema))
    body: { email: string; locale?: string }
  ) {
    return this.newsletter.subscribe(body.email, body.locale);
  }

  @Get('confirm')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  async confirm(
    @Query(new ZodValidationPipe(newsletterTokenSchema)) query: { token: string },
    @Res() res: Response
  ) {
    const result = await this.newsletter.confirm(query.token);
    return res.redirect(302, result.redirectUrl);
  }

  @Post('unsubscribe')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  unsubscribe(
    @Body(new ZodValidationPipe(newsletterUnsubscribeEmailSchema))
    body: { token?: string; email?: string }
  ) {
    if (body.token) {
      return this.newsletter.unsubscribeByToken(body.token);
    }
    return this.newsletter.unsubscribeByEmail(body.email!);
  }

  @Get('unsubscribe')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  unsubscribeGet(
    @Query(new ZodValidationPipe(newsletterTokenSchema)) query: { token: string }
  ) {
    return this.newsletter.unsubscribeByToken(query.token);
  }
}
