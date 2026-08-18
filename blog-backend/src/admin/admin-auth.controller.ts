import { Body, Controller, Get, Post, Put, UseGuards, UsePipes } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AuthService } from '../auth/auth.service';
import { AuthPayload, CurrentUser } from '../common/current-user.decorator';
import { LocalizedString } from '../common/helpers';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { loginSchema, profileUpdateSchema, refreshSchema } from '../common/schemas';
import { ZodValidationPipe } from '../common/zod-validation.pipe';

@Controller('api/admin/auth')
export class AdminAuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @UsePipes(new ZodValidationPipe(loginSchema))
  login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body.email, body.password);
  }

  @Post('refresh')
  @UsePipes(new ZodValidationPipe(refreshSchema))
  refresh(@Body() body: { refreshToken: string }) {
    return this.authService.refresh(body.refreshToken);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin, Role.editor)
  me(@CurrentUser() user: AuthPayload) {
    return this.authService.getMe(user.userId);
  }

  @Put('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin, Role.editor)
  updateMe(
    @CurrentUser() user: AuthPayload,
    @Body(new ZodValidationPipe(profileUpdateSchema))
    body: { displayName?: string; bio?: LocalizedString | null; avatarUrl?: string | null }
  ) {
    return this.authService.updateProfile(user.userId, body);
  }
}
