import { ModelError } from '@csisp-api/idp-server';
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';

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

    this.logger.error(
      `Exception: ${isHttpException ? httpException.message : (exception as Error)?.message}`,
      isHttpException ? undefined : (exception as Error)?.stack
    );

    response.status(status).json(errorResponse);
  }
}
