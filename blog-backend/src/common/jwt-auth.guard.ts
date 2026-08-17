import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import jwt from 'jsonwebtoken';
import { AuthPayload } from './current-user.decorator';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      headers: { authorization?: string };
      user?: AuthPayload;
    }>();

    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException({ error: 'Authentication required' });
    }

    try {
      const token = header.slice(7);
      const secret = this.config.getOrThrow<string>('JWT_SECRET');
      request.user = jwt.verify(token, secret) as AuthPayload;
      return true;
    } catch {
      throw new UnauthorizedException({ error: 'Invalid or expired token' });
    }
  }
}
