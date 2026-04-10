import type { RedisKV } from '@csisp/redis-sdk';
import { REDIS_KV } from '@csisp/redis-sdk/nest';
import {
  AuthApi,
  type AuthCreateExchangeCodeRequestParams,
  type AuthEnterRequestParams,
  type AuthForgotChallengeRequestParams,
  type AuthForgotInitRequestParams,
  type AuthForgotVerifyRequestParams,
  type AuthLoginRequestParams,
  type AuthMfaMethodsRequestParams,
  type AuthMultifactorRequestParams,
  type AuthRegisterRequestParams,
  type AuthResendSignupOtpRequestParams,
  type AuthResetPasswordRequestParams,
  type AuthResetPasswordRequestRequestParams,
  type AuthRsatokenRequestParams,
  type AuthSendOtpRequestParams,
  type AuthSessionRequestParams,
  type AuthVerifyOtpRequestParams,
  type AuthVerifySignupOtpRequestParams,
  type MFAType,
} from '@csisp-api/idp-server';
import { RedisPrefix } from '@idp-types/redis';
import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import type { Request as ExpressRequest, Response } from 'express';

import { AuthService } from './auth.service';
import { EnterDto } from './dto/enter.dto';
import { MultifactorDto } from './dto/multifactor.dto';
import { RegisterDto } from './dto/register.dto';

type IdpRequest = ExpressRequest & { idpUserId?: number; idpSession?: string };

@Injectable()
export class AuthApiImpl implements AuthApi {
  constructor(
    private readonly service: AuthService,
    @Inject(REDIS_KV) private readonly kv: RedisKV
  ) {}

  async authCreateExchangeCode(
    requestParams: AuthCreateExchangeCodeRequestParams,
    request: Request
  ) {
    const expressRequest = this.toExpressRequest(request);
    return this.service.createExchangeCode(
      requestParams.createExchangeCodeDto,
      expressRequest
    );
  }

  async authEnter(requestParams: AuthEnterRequestParams, request: Request) {
    const expressRequest = this.toExpressRequest(request);
    const response = this.getResponseFromRequest(request);
    const uid = (expressRequest as IdpRequest).idpUserId;
    return this.service.enter(
      requestParams.authEnterRequest as EnterDto,
      response,
      uid
    );
  }

  async authForgotChallenge(
    requestParams: AuthForgotChallengeRequestParams,
    _request: Request
  ) {
    const body = requestParams.authForgotChallengeRequest;
    return this.service.forgotChallenge({
      type: this.toNonEmptyString(body.type),
      studentId: this.toNonEmptyString(body.studentId),
    });
  }

  async authForgotInit(
    requestParams: AuthForgotInitRequestParams,
    _request: Request
  ) {
    const body = requestParams.authForgotInitRequest;
    return this.service.forgotInit({
      email: this.toNonEmptyString(body.email),
    });
  }

  async authForgotVerify(
    requestParams: AuthForgotVerifyRequestParams,
    _request: Request
  ) {
    const body = requestParams.authForgotVerifyRequest;
    return this.service.forgotVerify({
      type: this.toNonEmptyString(body.type),
      studentId: this.toNonEmptyString(body.studentId),
      code: this.toNonEmptyString(body.code),
    });
  }

  async authLogin(requestParams: AuthLoginRequestParams, request: Request) {
    const response = this.getRequiredResponseFromRequest(request);
    return this.service.loginEmailPassword(
      requestParams.loginInternalDto,
      response
    );
  }

  async authMfaMethods(
    _requestParams: AuthMfaMethodsRequestParams,
    request: Request
  ) {
    const expressRequest = this.toExpressRequest(request);
    const sessionId = (expressRequest as IdpRequest).idpSession;
    const multifactor = await this.service.mfaMethodsBySession(sessionId);
    return { multifactor };
  }

  async authMultifactor(
    requestParams: AuthMultifactorRequestParams,
    request: Request
  ) {
    const response = this.getResponseFromRequest(request);
    const body = requestParams.authMultifactorRequest;
    const multifactorDto: MultifactorDto = {
      type: this.toNumber(body.type) as MFAType,
      codeOrAssertion: this.toNonEmptyString(body.codeOrAssertion),
    };
    return this.service.multifactor(multifactorDto, response);
  }

  async authRegister(
    requestParams: AuthRegisterRequestParams,
    _request: Request
  ) {
    const registerDto: RegisterDto = {
      student_id: requestParams.registerDto.student_id,
      email: requestParams.registerDto.email,
      password: requestParams.registerDto.password,
      display_name: requestParams.registerDto.display_name ?? undefined,
    };
    return this.service.register(registerDto);
  }

  async authResendSignupOtp(
    requestParams: AuthResendSignupOtpRequestParams,
    _request: Request
  ) {
    return this.service.resendSignupOtp(requestParams.resendSignupOtpDto);
  }

  async authResetPassword(
    requestParams: AuthResetPasswordRequestParams,
    _request: Request
  ) {
    return this.service.resetPassword(requestParams.resetPasswordDto);
  }

  async authResetPasswordRequest(
    requestParams: AuthResetPasswordRequestRequestParams,
    _request: Request
  ) {
    return this.service.resetPasswordRequest({
      studentId: String(
        requestParams.resetPasswordRequestParams.studentId ?? ''
      ),
    });
  }

  async authRsatoken(
    _requestParams: AuthRsatokenRequestParams,
    _request: Request
  ) {
    return this.service.rsatoken({});
  }

  async authSendOtp(
    _requestParams: AuthSendOtpRequestParams,
    request: Request
  ) {
    return this.service.sendOtpStepUp(this.toExpressRequest(request));
  }

  async authSession(requestParams: AuthSessionRequestParams, request: Request) {
    const expressRequest = this.toExpressRequest(request);
    const idpRequest = expressRequest as IdpRequest;
    const body = requestParams.authSessionRequest;
    const logout = body.logout === true;
    if (logout && idpRequest.idpSession) {
      await this.safeDeleteSession(idpRequest.idpSession);
      const response = this.getResponseFromRequest(request);
      response?.clearCookie?.('idp_session');
      return { logged: false };
    }
    return this.service.session(idpRequest.idpUserId);
  }

  async authVerifyOtp(
    requestParams: AuthVerifyOtpRequestParams,
    request: Request
  ) {
    return this.service.verifyOtpStepUp(
      requestParams.verifyOtpDto,
      this.toExpressRequest(request)
    );
  }

  async authVerifySignupOtp(
    requestParams: AuthVerifySignupOtpRequestParams,
    _request: Request
  ) {
    return this.service.verifySignupOtp(requestParams.verifySignupOtpDto);
  }

  private getResponseFromRequest(request: Request): Response | undefined {
    const expressRequest = this.toExpressRequest(request);
    return expressRequest.res;
  }

  private getRequiredResponseFromRequest(request: Request): Response {
    const response = this.getResponseFromRequest(request);
    if (!response) {
      throw new InternalServerErrorException('response not available');
    }
    return response;
  }

  private async safeDeleteSession(sessionId: string) {
    try {
      await this.kv.del(`${RedisPrefix.IdpSession}${sessionId}`);
    } catch {}
  }

  private toExpressRequest(request: Request): ExpressRequest {
    return request as unknown as ExpressRequest;
  }

  private toNonEmptyString(rawValue: unknown): string {
    return String(rawValue ?? '').trim();
  }

  private toNumber(rawValue: unknown): number {
    return Number(rawValue ?? 0);
  }
}
