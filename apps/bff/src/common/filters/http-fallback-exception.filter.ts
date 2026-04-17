import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

import { HttpErrorResponse } from '../errors/http-error.types';

@Catch()
export class HttpFallbackExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpFallbackExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    const traceId = request.headers['x-trace-id'] as string | undefined;

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal Server Error';
    let details: unknown = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const errorObj = exceptionResponse as Record<string, unknown>;
        message = (errorObj.message as string) || exception.message;
        details = errorObj.errors ?? errorObj.details;
      } else {
        message = exception.message;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error(`Unhandled exception: ${message}`, exception.stack);
    }

    const errorResponse: HttpErrorResponse = {
      code: status,
      message,
      details,
    };

    if (traceId) {
      errorResponse.traceId = traceId;
    }

    response.status(status).json(errorResponse);
  }
}
