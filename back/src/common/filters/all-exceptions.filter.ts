import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: any = 'Internal server error';
    let code = 'ERR_INTERNAL';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse() as any;
      message = res.message || res;
      code = res.code || 'ERR_HTTP';
    } else if (exception instanceof QueryFailedError) {
      status = HttpStatus.BAD_REQUEST;
      message = 'Database operation failed';
      code = 'ERR_DATABASE';
      this.logger.error(`Database Error: ${exception.message}`);
    } else {
      this.logger.error(`Unhandled Exception: ${exception}`);
    }

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      code,
      message,
    };

    response.status(status).json(errorResponse);
  }
}
