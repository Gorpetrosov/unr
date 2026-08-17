import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ZodError } from 'zod';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();

    if (exception instanceof ZodError) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        error: 'Validation failed',
        details: exception.flatten(),
      });
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();

      if (typeof response === 'string') {
        return res.status(status).json({ error: response });
      }

      const body = response as Record<string, unknown>;
      if (body.error) {
        return res.status(status).json(body);
      }

      return res.status(status).json({
        error: body.message || 'Request failed',
        details: body,
      });
    }

    console.error(exception);
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      error: 'Internal server error',
    });
  }
}
