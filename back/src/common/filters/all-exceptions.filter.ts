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
import { randomUUID } from 'crypto';

interface HttpErrorBody {
  message?: string | string[];
  code?: string;
  error?: string;
}

interface StableErrorResponse {
  statusCode: number;
  code: string;
  message: string | string[];
  path: string;
  method: string;
  timestamp: string;
  traceId: string;
}

/** Códigos PG que exponemos como conflicto en vez de 500. */
const PG_CONFLICT_CODES = new Set(['23505', '23P01', '40001']);

/**
 * Filtro global: formato de error estable, sin filtrar detalles
 * internos del driver ni PII a los clientes.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const traceId = randomUUID();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let code = 'ERR_INTERNAL';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === 'string') {
        message = body;
        code = 'ERR_HTTP';
      } else if (body && typeof body === 'object') {
        const parsed = body as HttpErrorBody;
        message = parsed.message ?? parsed.error ?? 'Request failed';
        code = parsed.code ?? 'ERR_HTTP';
      }
    } else if (exception instanceof QueryFailedError) {
      const driverCode =
        typeof (exception as { code?: unknown }).code === 'string'
          ? (exception as unknown as { code: string }).code
          : undefined;
      if (driverCode && PG_CONFLICT_CODES.has(driverCode)) {
        status = HttpStatus.CONFLICT;
        message = 'Conflicto de datos: el recurso ya existe o se solapa';
        code = 'ERR_CONFLICT';
      } else {
        status = HttpStatus.BAD_REQUEST;
        message = 'Database operation failed';
        code = 'ERR_DATABASE';
      }
      // Nunca exponer el SQL/driver al cliente; solo al log
      this.logger.error(
        `Database error traceId=${traceId} code=${driverCode ?? 'unknown'}: ${exception.message}`,
      );
    } else {
      this.logger.error(
        `Unhandled exception traceId=${traceId}: ${exception instanceof Error ? exception.message : 'unknown'}`,
      );
    }

    const errorResponse: StableErrorResponse = {
      statusCode: status,
      code,
      message,
      path: request.url,
      method: request.method,
      timestamp: new Date().toISOString(),
      traceId,
    };

    response.status(status).json(errorResponse);
  }
}
