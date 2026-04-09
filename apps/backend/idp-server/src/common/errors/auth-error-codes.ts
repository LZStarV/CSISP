import { HttpException, HttpStatus } from '@nestjs/common';

export enum AuthErrorCode {
  AUTH_STEP_UP_REQUIRED = 'AUTH_STEP_UP_REQUIRED',
  OTP_INVALID_OR_EXPIRED = 'OTP_INVALID_OR_EXPIRED',
  EXCHANGE_CODE_INVALID = 'EXCHANGE_CODE_INVALID',
  EXCHANGE_CODE_CONSUMED = 'EXCHANGE_CODE_CONSUMED',
  UNAUTHORIZED = 'UNAUTHORIZED',
  RATE_LIMITED = 'RATE_LIMITED',
}

export class AuthApiException extends HttpException {
  readonly code: AuthErrorCode;
  constructor(
    code: AuthErrorCode,
    message: string,
    status: HttpStatus = HttpStatus.BAD_REQUEST
  ) {
    super({ code, message }, status);
    this.code = code;
  }
}

export class JsonRpcAuthException extends AuthApiException {}
