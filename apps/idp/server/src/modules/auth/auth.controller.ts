import { randomUUID, randomBytes } from 'crypto';

import { ApiIdpController } from '@common/decorators/controller.decorator';
import { IdpSessionGuard } from '@common/guards/idp-session.guard';
import { AuthErrorCode, JsonRpcAuthException } from '@common/rpc/error-codes';
import { JsonRpcInterceptor } from '@common/rpc/json-rpc.interceptor';
import { RpcRequestPipe } from '@common/rpc/rpc-request.pipe';
import { config } from '@config';
import type { RedisKV } from '@csisp/redis-sdk';
import { REDIS_KV } from '@csisp/redis-sdk/nest';
import { parseEnum } from '@csisp/utils';
import { RedisPrefix } from '@idp-types/redis';
import { getIdpBaseLogger } from '@infra/logger';
import { ExchangeStore } from '@infra/redis/exchange.store';
import { StepUpStore } from '@infra/redis/stepup.store';
import { GotrueService, SupabaseDataAccess } from '@infra/supabase';
import { ResetReason } from '@modules/auth/enums';
import { OidcPolicyHelper } from '@modules/oidc/helpers/oidc.policy';
import { Inject } from '@nestjs/common';
import { BadRequestException } from '@nestjs/common';
import {
  Body,
  Post,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { HttpStatus } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import type { Response, Request } from 'express';

import { AuthService } from './auth.service';
import { CreateExchangeCodeDto } from './dto/create-exchange-code.dto';
import { EnterDto } from './dto/enter.dto';
import { LoginInternalDto } from './dto/login-internal.dto';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

function maskEmail(email?: string | null): string | undefined {
  if (!email) return undefined;
  const at = email.indexOf('@');
  if (at <= 0) return email.slice(0, 2) + '**';
  const name = email.slice(0, at);
  const domain = email.slice(at + 1);
  const head = name.slice(0, 2);
  return `${head}**@${domain}`;
}

/**
 * AuthController 重构：采用声明式路由与拦截器模式
 * - 移除手动的 makeAuthDispatch 映射表
 * - 利用 JsonRpcInterceptor 自动包装响应体
 * - 保持 /api/idp/auth/:action 的路由兼容性
 */
@ApiIdpController('auth')
@UseGuards(IdpSessionGuard)
@UseInterceptors(JsonRpcInterceptor)
export class AuthController {
  constructor(
    private readonly service: AuthService,
    private readonly gotrue: GotrueService,
    private readonly sda: SupabaseDataAccess,
    @Inject(REDIS_KV) private readonly kv: RedisKV
  ) {}

  private async bump(key: string): Promise<void> {
    try {
      const n = await this.kv.incr(key);
      if (n === 1) {
        await this.kv.expire(key, 3600);
      }
    } catch {}
  }

  @Post('rsatoken')
  async rsatoken() {
    return this.service.rsatoken({});
  }

  @Post('login')
  async login(
    @Body(RpcRequestPipe) { params }: any,
    @Res({ passthrough: true }) res: Response
  ) {
    const logger = getIdpBaseLogger().child({ module: 'auth' });
    if (typeof params?.email === 'string') {
      const loginInternal = plainToInstance(LoginInternalDto, {
        email: params.email,
        password: params.password,
      });
      const errsInternal = validateSync(loginInternal, { whitelist: true });
      if (errsInternal.length) throw new BadRequestException('Invalid params');
      try {
        await this.gotrue.signInWithPassword({
          email: loginInternal.email,
          password: loginInternal.password,
        });
        const sid = randomUUID();
        const store = new StepUpStore(this.kv);
        await store.setPendingPassword(sid, loginInternal.email, 600);
        res.cookie('idp_stepup', sid, {
          httpOnly: true,
          secure: config.runtime.isProduction,
          sameSite: 'strict',
          domain: config.session.cookieDomain,
          path: '/',
          maxAge: 600 * 1000,
        });
        logger.info(
          {
            event: 'login',
            result: 'success',
            email: maskEmail(loginInternal.email),
            sid,
          },
          'auth login success'
        );
        await this.bump('metric:auth:login_success');
        return { stepUp: 'PENDING_PASSWORD' };
      } catch (e: any) {
        const status = Number(e?.status ?? 400);
        if (status === 429) {
          logger.warn(
            {
              event: 'login',
              result: 'failed',
              email: maskEmail(loginInternal.email),
              err: { code: 'RATE_LIMITED' },
            },
            'auth login rate limited'
          );
          await this.bump('metric:auth:login_rate_limited');
          throw new JsonRpcAuthException(
            AuthErrorCode.RATE_LIMITED,
            'Too many requests'
          );
        }
        logger.warn(
          {
            event: 'login',
            result: 'failed',
            email: maskEmail(loginInternal.email),
            err: { code: 'UNAUTHORIZED' },
          },
          'auth login failed'
        );
        await this.bump('metric:auth:login_failed');
        throw new JsonRpcAuthException(
          AuthErrorCode.UNAUTHORIZED,
          'Invalid email or password'
        );
      }
    }
    const dto = plainToInstance(LoginDto, {
      studentId: params.studentId,
      password: params.password,
    });
    const errs = validateSync(dto, { whitelist: true });
    if (errs.length) throw new BadRequestException('Invalid params');
    return this.service.login(dto, res);
  }

  @Post('send-otp')
  async sendOtp(@Body(RpcRequestPipe) _body: any, @Req() req: Request) {
    const logger = getIdpBaseLogger().child({ module: 'auth' });
    const sid = (req as any).cookies?.idp_stepup as string | undefined;
    if (!sid) {
      throw new JsonRpcAuthException(
        AuthErrorCode.UNAUTHORIZED,
        'No step-up session'
      );
    }
    const store = new StepUpStore(this.kv);
    const cur = await store.getState(sid);
    if (!cur) {
      throw new JsonRpcAuthException(
        AuthErrorCode.UNAUTHORIZED,
        'Step-up session not found'
      );
    }
    if (cur.state === 'VERIFIED') {
      throw new JsonRpcAuthException(
        AuthErrorCode.UNAUTHORIZED,
        'Already verified'
      );
    }
    if (cur.state !== 'PENDING_PASSWORD') {
      throw new JsonRpcAuthException(
        AuthErrorCode.AUTH_STEP_UP_REQUIRED,
        'Step-up state mismatch'
      );
    }
    try {
      if (!cur.email) {
        throw new JsonRpcAuthException(
          AuthErrorCode.UNAUTHORIZED,
          'Email missing'
        );
      }
      await store.setPendingEmailOtp(sid, 600);
      await this.gotrue.signInWithOtp({ email: cur.email });
      logger.info(
        {
          event: 'send_otp',
          result: 'success',
          email: maskEmail(cur.email),
          sid,
        },
        'auth send otp success'
      );
      await this.bump('metric:auth:otp_send_success');
      return { ok: true };
    } catch (e: any) {
      const status = Number(e?.status ?? 400);
      if (status === 429) {
        logger.warn(
          {
            event: 'send_otp',
            result: 'failed',
            email: maskEmail(cur?.email),
            sid,
            err: { code: 'RATE_LIMITED' },
          },
          'auth send otp rate limited'
        );
        await this.bump('metric:auth:otp_send_rate_limited');
        throw new JsonRpcAuthException(
          AuthErrorCode.RATE_LIMITED,
          'Too many requests'
        );
      }
      if (e instanceof JsonRpcAuthException) {
        logger.warn(
          {
            event: 'send_otp',
            result: 'failed',
            email: maskEmail(cur?.email),
            sid,
            err: { code: 'UNAUTHORIZED' },
          },
          'auth send otp failed'
        );
        await this.bump('metric:auth:otp_send_failed');
        throw e;
      }
      logger.warn(
        {
          event: 'send_otp',
          result: 'failed',
          email: maskEmail(cur?.email),
          sid,
          err: { code: 'UNAUTHORIZED' },
        },
        'auth send otp failed'
      );
      await this.bump('metric:auth:otp_send_failed');
      throw new JsonRpcAuthException(
        AuthErrorCode.UNAUTHORIZED,
        'Failed to send OTP'
      );
    }
  }

  @Post('verify-otp')
  async verifyOtp(@Body(RpcRequestPipe) { params }: any, @Req() req: Request) {
    const logger = getIdpBaseLogger().child({ module: 'auth' });
    const dto = plainToInstance(VerifyOtpDto, {
      token_hash: params.token_hash,
      type: params.type,
    });
    const errs = validateSync(dto, { whitelist: true });
    if (errs.length) throw new BadRequestException('Invalid params');
    const sid = (req as any).cookies?.idp_stepup as string | undefined;
    if (!sid) {
      throw new JsonRpcAuthException(
        AuthErrorCode.UNAUTHORIZED,
        'No step-up session'
      );
    }
    const store = new StepUpStore(this.kv);
    const cur = await store.getState(sid);
    if (!cur) {
      throw new JsonRpcAuthException(
        AuthErrorCode.UNAUTHORIZED,
        'Step-up session not found'
      );
    }
    if (cur.state === 'VERIFIED') {
      throw new JsonRpcAuthException(
        AuthErrorCode.UNAUTHORIZED,
        'Already verified'
      );
    }
    if (cur.state !== 'PENDING_EMAIL_OTP') {
      throw new JsonRpcAuthException(
        AuthErrorCode.AUTH_STEP_UP_REQUIRED,
        'Step-up state mismatch'
      );
    }
    try {
      const type =
        dto.type === 'magic_link' ? ('magiclink' as const) : ('email' as const);
      await this.gotrue.verifyOtp({
        token_hash: dto.token_hash,
        type,
      });
      await store.setVerified(sid, 600);
      logger.info(
        {
          event: 'verify_otp',
          result: 'success',
          email: maskEmail(cur.email),
          sid,
        },
        'auth verify otp success'
      );
      await this.bump('metric:auth:otp_verify_success');
      return { verified: true };
    } catch {
      logger.warn(
        {
          event: 'verify_otp',
          result: 'failed',
          email: maskEmail(cur?.email),
          sid,
          err: { code: 'OTP_INVALID_OR_EXPIRED' },
        },
        'auth verify otp failed'
      );
      await this.bump('metric:auth:otp_verify_failed');
      throw new JsonRpcAuthException(
        AuthErrorCode.OTP_INVALID_OR_EXPIRED,
        'OTP invalid or expired'
      );
    }
  }

  @Post('createExchangeCode')
  async createExchangeCode(
    @Body(RpcRequestPipe) { params }: any,
    @Req() req: Request
  ) {
    const logger = getIdpBaseLogger().child({ module: 'auth' });
    const dto = plainToInstance(CreateExchangeCodeDto, {
      app_id: params.app_id,
      redirect_uri: params.redirect_uri,
      state: params.state,
    });
    const errs = validateSync(dto, { whitelist: true });
    if (errs.length) throw new BadRequestException('Invalid params');
    const sid = (req as any).cookies?.idp_stepup as string | undefined;
    if (!sid) {
      throw new JsonRpcAuthException(
        AuthErrorCode.AUTH_STEP_UP_REQUIRED,
        'No step-up session'
      );
    }
    const step = new StepUpStore(this.kv);
    const cur = await step.getState(sid);
    if (!cur || cur.state !== 'VERIFIED') {
      throw new JsonRpcAuthException(
        AuthErrorCode.AUTH_STEP_UP_REQUIRED,
        'Step-up not verified'
      );
    }
    try {
      const quotaKey = `xchg:quota:${sid}`;
      const n = await this.kv.incr(quotaKey);
      if (n === 1) {
        await this.kv.expire(quotaKey, 30);
      }
      if (n > 1) {
        logger.warn(
          {
            event: 'create_exchange_code',
            result: 'failed',
            email: maskEmail(cur.email),
            sid,
            app_id: dto.app_id,
            redirect_uri: dto.redirect_uri,
            err: { code: 'RATE_LIMITED' },
          },
          'auth create exchange code rate limited'
        );
        await this.bump('metric:auth:xchg_rate_limited');
        throw new JsonRpcAuthException(
          AuthErrorCode.RATE_LIMITED,
          'Too many requests'
        );
      }
      const { data: client } = await this.sda
        .service()
        .from('oidc_clients')
        .select('allowed_redirect_uris,status')
        .eq('client_id', dto.app_id)
        .maybeSingle<{
          allowed_redirect_uris: string[] | string | null;
          status: string;
        }>();
      const active = client && client.status === 'active';
      const allowed =
        active &&
        OidcPolicyHelper.isRedirectUriAllowed(
          dto.redirect_uri,
          client!.allowed_redirect_uris
        );
      if (!allowed) {
        throw new JsonRpcAuthException(
          AuthErrorCode.EXCHANGE_CODE_INVALID,
          'redirect_uri not allowed'
        );
      }
      const code = randomBytes(32).toString('base64url');
      const ua = req.headers['user-agent'];
      const ip = (req as any).ip as string | undefined;
      const store = new ExchangeStore(this.kv);
      await store.issue(
        code,
        {
          sid,
          email: cur.email ?? null,
          app_id: dto.app_id,
          redirect_uri: dto.redirect_uri,
          ua: typeof ua === 'string' ? ua : undefined,
          ip,
        },
        60
      );
      try {
        await step.clear(sid);
      } catch {}
      logger.info(
        {
          event: 'create_exchange_code',
          result: 'success',
          email: maskEmail(cur.email),
          sid,
          app_id: dto.app_id,
          redirect_uri: dto.redirect_uri,
        },
        'auth create exchange code success'
      );
      await this.bump('metric:auth:xchg_issue_success');
      return { code, redirect_uri: dto.redirect_uri, state: dto.state };
    } catch (e) {
      if (e instanceof JsonRpcAuthException) throw e;
      logger.warn(
        {
          event: 'create_exchange_code',
          result: 'failed',
          email: maskEmail(cur?.email),
          sid,
          app_id: dto.app_id,
          redirect_uri: dto.redirect_uri,
          err: { code: 'EXCHANGE_CODE_INVALID' },
        },
        'auth create exchange code failed'
      );
      await this.bump('metric:auth:xchg_issue_failed');
      throw new JsonRpcAuthException(
        AuthErrorCode.EXCHANGE_CODE_INVALID,
        'Failed to create exchange code'
      );
    }
  }

  @Post('multifactor')
  async multifactor(
    @Body(RpcRequestPipe) { params: _params }: any,
    @Res({ passthrough: true }) _res: Response
  ) {
    throw new JsonRpcAuthException(
      AuthErrorCode.UNAUTHORIZED,
      'Not implemented',
      HttpStatus.NOT_IMPLEMENTED
    );
  }

  @Post('reset_password_request')
  async resetPasswordRequest(@Body(RpcRequestPipe) { params }: any) {
    return this.service.resetPasswordRequest({
      studentId: String(params.studentId ?? ''),
    });
  }

  @Post('reset_password')
  async resetPassword(@Body(RpcRequestPipe) { params }: any) {
    const reasonParsed = parseEnum(
      params.reason,
      ResetReason,
      ResetReason.WeakPassword
    );
    const dto = plainToInstance(ResetPasswordDto, {
      studentId: params.studentId,
      newPassword: params.newPassword,
      resetToken: params.resetToken,
    });
    const errs = validateSync(dto, { whitelist: true });
    if (errs.length) throw new BadRequestException('Invalid params');
    return this.service.resetPassword({
      ...dto,
      reason: reasonParsed,
    });
  }

  @Post('enter')
  async enter(
    @Body(RpcRequestPipe) { params }: any,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response
  ) {
    type IdpRequest = Request & { idpUserId?: number };
    const uid = (request as IdpRequest).idpUserId;
    const dto = plainToInstance(EnterDto, {
      state: params.state,
      ticket: params.ticket,
      studentId: params.studentId,
      redirectMode:
        typeof params.redirectMode === 'string'
          ? (params.redirectMode as string)
          : undefined,
    });
    const errs = validateSync(dto, { whitelist: true });
    if (errs.length) throw new BadRequestException('Invalid params');
    return this.service.enter(dto as any, response, uid);
  }

  @Post('mfa_methods')
  async mfaMethods(@Req() request: Request) {
    type IdpRequest = Request & { idpSession?: string };
    const sid = (request as IdpRequest).idpSession;
    const list = await this.service.mfaMethodsBySession(sid);
    return { multifactor: list };
  }

  @Post('forgot_init')
  async forgotInit(@Body(RpcRequestPipe) { params }: any) {
    return this.service.forgotInit({
      studentId: String(params.studentId ?? ''),
    });
  }

  @Post('forgot_challenge')
  async forgotChallenge(@Body(RpcRequestPipe) { params }: any) {
    return this.service.forgotChallenge({
      type: String(params.type ?? ''),
      studentId: String(params.studentId ?? ''),
    });
  }

  @Post('forgot_verify')
  async forgotVerify(@Body(RpcRequestPipe) { params }: any) {
    return this.service.forgotVerify({
      type: String(params.type ?? ''),
      studentId: String(params.studentId ?? ''),
      code: String(params.code ?? ''),
    });
  }

  @Post('session')
  async session(
    @Body(RpcRequestPipe) { params }: any,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response
  ) {
    type IdpRequest = Request & { idpUserId?: number; idpSession?: string };
    const req = request as IdpRequest;
    const logout = !!params?.logout;
    const sid = req.idpSession;
    if (logout && sid) {
      try {
        await this.kv.del(`${RedisPrefix.IdpSession}${sid}`);
      } catch {}
      response.clearCookie?.('idp_session');
      return { logged: false };
    }
    const uid = req.idpUserId;
    return this.service.session(uid);
  }
}
