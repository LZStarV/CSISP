import { ModelError, CommonErrorCode } from '@csisp-api/idp-server';
import { HttpException, HttpStatus } from '@nestjs/common';

export { CommonErrorCode };

/**
 * 通用异常类
 * @param code 错误码
 * @param message 错误消息
 * @param status HTTP 状态码
 * @param details 错误详情
 */
export class CommonApiException extends HttpException {
  readonly code: CommonErrorCode;
  constructor(
    code: CommonErrorCode,
    message: string,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
    details?: any
  ) {
    const errorResponse: ModelError = {
      code,
      message,
      details,
    };
    super(errorResponse, status);
    this.code = code;
  }
}
