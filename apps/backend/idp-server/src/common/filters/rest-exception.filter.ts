import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  ForbiddenException,
  HttpException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

type RestErrorBody = {
  code: string;
  message: string;
  details?: unknown;
  traceId?: string;
};

@Catch()
export class RestExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<any>();
    const request = ctx.getRequest<any>();
    const traceId = request?.headers?.['x-trace-id'];
    let status = 500;
    let body: RestErrorBody = {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
    };

    if (exception instanceof BadRequestException) {
      status = exception.getStatus();
      const payload = exception.getResponse() as any;
      body = {
        code: payload?.code ?? 'BAD_REQUEST',
        message:
          typeof payload?.message === 'string'
            ? payload.message
            : exception.message,
        details: payload?.details ?? payload?.message,
      };
    } else if (exception instanceof UnauthorizedException) {
      status = exception.getStatus();
      const payload = exception.getResponse() as any;
      body = {
        code: payload?.code ?? 'UNAUTHORIZED',
        message:
          typeof payload?.message === 'string'
            ? payload.message
            : exception.message,
        details: payload?.details,
      };
    } else if (exception instanceof ForbiddenException) {
      status = exception.getStatus();
      const payload = exception.getResponse() as any;
      body = {
        code: payload?.code ?? 'FORBIDDEN',
        message:
          typeof payload?.message === 'string'
            ? payload.message
            : exception.message,
        details: payload?.details,
      };
    } else if (exception instanceof NotFoundException) {
      status = exception.getStatus();
      const payload = exception.getResponse() as any;
      body = {
        code: payload?.code ?? 'NOT_FOUND',
        message:
          typeof payload?.message === 'string'
            ? payload.message
            : exception.message,
        details: payload?.details,
      };
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const payload = exception.getResponse() as any;
      body = {
        code: payload?.code ?? 'HTTP_EXCEPTION',
        message:
          typeof payload?.message === 'string'
            ? payload.message
            : exception.message,
        details: payload?.details,
      };
    } else if (exception instanceof Error) {
      body = {
        code: 'INTERNAL_ERROR',
        message: exception.message || 'Internal server error',
      };
    }

    if (typeof traceId === 'string' && traceId.length > 0) {
      body.traceId = traceId;
      response.setHeader?.('x-trace-id', traceId);
    }
    response.status(status).json(body);
  }
}
