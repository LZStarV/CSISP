import { ModelError } from '@csisp-api/idp-server';
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';

interface ErrorWithCause extends Error {
  cause?: unknown;
}

@Catch()
export class RestExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(RestExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<any>();
    const request = ctx.getRequest<any>();
    const traceId = request?.headers?.['x-trace-id'];

    const httpException = exception as HttpException;
    const isHttpException = httpException instanceof HttpException;

    const status = isHttpException ? httpException.getStatus() : 500;
    const errorResponse: any = isHttpException
      ? (httpException.getResponse() as ModelError)
      : {
          code: 'INTERNAL_ERROR',
          message: (exception as Error)?.message || 'Internal server error',
        };

    if (traceId) {
      errorResponse.traceId = traceId;
    }

    const error = exception as ErrorWithCause;
    const errorDetails: any = {
      message: error?.message,
      name: error?.name,
      stack: error?.stack,
      cause: error?.cause,
    };

    if (error instanceof TypeError) {
      this.logger.error(
        `TypeError: ${error.message}`,
        JSON.stringify(errorDetails, null, 2)
      );
    } else {
      this.logger.error(
        `Exception: ${isHttpException ? httpException.message : error?.message}`,
        isHttpException ? undefined : error?.stack
      );
    }

    response.status(status).json(errorResponse);
  }
}
