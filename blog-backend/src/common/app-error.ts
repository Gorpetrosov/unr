import { HttpException, HttpStatus } from '@nestjs/common';

export class AppError extends HttpException {
  constructor(message: string, statusCode = HttpStatus.BAD_REQUEST, details?: unknown) {
    super(
      {
        error: message,
        details,
      },
      statusCode
    );
  }
}
