import { HttpStatus } from '@nestjs/common';

// HTTP 错误响应类型
export interface HttpErrorResponse {
  code: HttpStatus;
  message: string;
  details?: unknown;
  traceId?: string;
}
