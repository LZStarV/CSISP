import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { AxiosError } from 'axios';
import { Response } from 'express';

@Catch(AxiosError)
export class AxiosExceptionFilter implements ExceptionFilter {
  catch(exception: AxiosError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception.response) {
      const status = exception.response.status;
      const data = exception.response.data;

      // 确保即使在异常响应中也透传后端的 Set-Cookie
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
      // 网络错误或超时等非 HTTP 状态码错误
      response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: exception.message,
      });
    }
  }
}
