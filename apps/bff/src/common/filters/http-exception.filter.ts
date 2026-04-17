import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { AxiosError } from 'axios';
import { Response } from 'express';

import { HttpErrorResponse } from '../errors/http-error.types';

@Catch(AxiosError)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: AxiosError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    const traceId = request.headers['x-trace-id'] as string | undefined;

    if (exception.response) {
      const status = exception.response.status as HttpStatus;
      const upstreamData = exception.response
        .data as Partial<HttpErrorResponse>;

      const data: HttpErrorResponse = {
        code: status,
        message: upstreamData.message ?? 'Upstream server error',
        details: upstreamData.details,
      };

      if (traceId) {
        data.traceId = traceId;
      } else if (upstreamData.traceId) {
        data.traceId = upstreamData.traceId;
      }

      const newCookies = exception.response.headers['set-cookie'];
      if (newCookies) {
        const existingCookies = response.getHeader('set-cookie');
        const existingArray = Array.isArray(existingCookies)
          ? existingCookies
          : existingCookies
            ? [String(existingCookies)]
            : [];
        const newArray = Array.isArray(newCookies)
          ? newCookies
          : [String(newCookies)];
        response.setHeader('set-cookie', [...existingArray, ...newArray]);
      }

      response.status(status).json(data);
    } else {
      // 上游请求失败
      const status = HttpStatus.INTERNAL_SERVER_ERROR;
      const data: HttpErrorResponse = {
        code: status,
        message: exception.message || 'Network error',
      };

      if (traceId) {
        data.traceId = traceId;
      }

      this.logger.error(`Network error: ${exception.message}`, exception.stack);

      response.status(status).json(data);
    }
  }
}
