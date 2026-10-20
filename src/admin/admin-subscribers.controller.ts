import { Controller, Get, Query, UseGuards, UsePipes } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { newsletterAdminQuerySchema } from '../common/schemas';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { NewsletterService } from '../newsletter/newsletter.service';

@Controller('api/admin/subscribers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.admin, Role.editor)
export class AdminSubscribersController {
  constructor(private readonly newsletter: NewsletterService) {}

  @Get()
  @UsePipes(new ZodValidationPipe(newsletterAdminQuerySchema))
  list(@Query() query: { page: number; limit: number; status?: string }) {
    return this.newsletter.listSubscribers(query);
  }
}
