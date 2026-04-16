import { ModelError } from '@csisp-api/idp-server';
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';

@Catch()
export class RestExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<any>();
    const request = ctx.getRequest<any>();
    const traceId = request?.headers?.['x-trace-id'];

    const httpException = exception as HttpException;
    const status = httpException.getStatus();
    const errorResponse = httpException.getResponse() as ModelError;

    if (
      traceId &&
      typeof errorResponse === 'object' &&
      errorResponse !== null
    ) {
      errorResponse.traceId = traceId;
    }

    response.status(status).json(errorResponse);
  }
}
