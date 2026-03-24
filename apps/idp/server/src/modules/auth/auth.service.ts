import crypto from 'crypto';

import { AuthErrorCode, JsonRpcAuthException } from '@common/rpc/error-codes';
import { config } from '@config';
import type { RedisKV } from '@csisp/redis-sdk';
import { REDIS_KV } from '@csisp/redis-sdk/nest';
import { RedisPrefix } from '@idp-types/redis';
import { hashPasswordScrypt } from '@infra/crypto/password';
import { getPublicKey } from '@infra/crypto/rsa';
import { getIdpLogger } from '@infra/logger';
import { getIdpBaseLogger } from '@infra/logger';
import { ExchangeStore } from '@infra/redis/exchange.store';
import { StepUpStore } from '@infra/redis/stepup.store';
import { SupabaseDataAccess } from '@infra/supabase';
import { GotrueService } from '@infra/supabase';
import { OidcPolicyHelper } from '@modules/oidc/helpers/oidc.policy';
import { Injectable, HttpException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import {
  SessionIssuer,
  defaultSessionOptions,
  SessionMode,
} from '@utils/session.issuer';
import { TicketIssuer, TicketIdType } from '@utils/ticket.issuer';
import type { Response } from 'express';
import type { Request } from 'express';

import { EnterDto } from './dto/enter.dto';
import { LoginInternalDto } from './dto/login-internal.dto';
import { MultifactorDto } from './dto/multifactor.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import {
  Next,
  MFAType,
  IMethod,
  AuthNextStep,
  RSATokenResult,
  ResetReason,
  RecoveryInitResult,
  RecoveryMethod,
  VerifyResult,
  RecoveryUnavailableReason,
  SessionResult,
} from './enums';

type MfaSettingsPick = {
  sms_enabled: boolean | null;
  email_enabled: boolean | null;
  fido2_enabled: boolean | null;
  otp_enabled: boolean | null;
  phone_number: string | null;
  required: boolean | null;
};

type RpcParams = Record<string, any>;

/**
 * 认证服务
 * - rsatoken：返回 RSA 公钥与短时 token
 * - login：账号密码校验 + 首次登录分流（reset_password）或进入多因子（multifactor）
 * - multifactor：短信验证码最小闭环（请求/校验），后续进入 enter
 * - reset_password：使用 scrypt 进行改密并写库
 * - enter：签发访问/刷新令牌（HS256）并通过 Cookie 下发
 */
@Injectable()
export class AuthService {
  private readonly sessionIssuer: SessionIssuer;
  private readonly resetTicketIssuer: TicketIssuer;

  private readonly oidcTicketIssuer: TicketIssuer<any>;

  private readonly oidcAuthReqIssuer: TicketIssuer<any>;

  private readonly oidcCodeIssuer: TicketIssuer<any>;

  constructor(
    private readonly sda: SupabaseDataAccess,
    private readonly gotrue: GotrueService,
    @Inject(REDIS_KV) private readonly kv: RedisKV
  ) {
    this.sessionIssuer = new SessionIssuer(defaultSessionOptions, kv);
    this.resetTicketIssuer = new TicketIssuer(
      { prefix: RedisPrefix.IdpReset, ttl: 900 },
      kv
    );
    this.oidcTicketIssuer = new TicketIssuer<any>(
      { prefix: RedisPrefix.OidcTicket, ttl: 600, idType: TicketIdType.UUID },
      kv
    );
    this.oidcAuthReqIssuer = new TicketIssuer<any>(
      { prefix: RedisPrefix.OidcAuthReq, ttl: 600 },
      kv
    );
    this.oidcCodeIssuer = new TicketIssuer<any>(
      { prefix: RedisPrefix.OidcCode, ttl: 600 },
      kv
    );
  }

  /**
   * 邮箱+密码登录
   */
  async loginEmailPassword(
    dto: LoginInternalDto,
    res: Response
  ): Promise<{ stepUp: 'PENDING_PASSWORD' }> {
    const logger = getIdpBaseLogger().child({ module: 'auth' });
    try {
      await this.gotrue.signInWithPassword({
        email: dto.email,
        password: dto.password,
      });
      const sid = crypto.randomUUID();
      const store = new StepUpStore(this.kv);
      await store.setPendingPassword(sid, dto.email, 600);
      res.cookie('idp_stepup', sid, {
        httpOnly: true,
        secure: config.runtime.isProduction,
        sameSite: 'strict',
        domain: config.session.cookieDomain,
        path: '/',
        maxAge: 600 * 1000,
      });
      logger.info(
        { event: 'login', result: 'success', email: dto.email, sid },
        'auth login success'
      );
      return { stepUp: 'PENDING_PASSWORD' };
    } catch {
      logger.warn(
        { event: 'login', result: 'failed', email: dto.email },
        'auth login failed'
      );
      throw new JsonRpcAuthException(
        AuthErrorCode.UNAUTHORIZED,
        'Invalid email or password'
      );
    }
  }

  /**
   * 发送邮箱 OTP
   */
  async sendOtpStepUp(req: Request): Promise<{ ok: true }> {
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
        email: cur.email,
        sid,
      },
      'auth send otp success'
    );
    return { ok: true };
  }

  /**
   * 校验邮箱 OTP（Step-up 完成）
   */
  async verifyOtpStepUp(
    dto: { token: string },
    req: Request
  ): Promise<{ verified: true }> {
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
    if (cur.state !== 'PENDING_EMAIL_OTP') {
      throw new JsonRpcAuthException(
        AuthErrorCode.AUTH_STEP_UP_REQUIRED,
        'Step-up state mismatch'
      );
    }
    try {
      await this.gotrue.verifyOtp({
        email: cur.email!,
        token: dto.token,
        type: 'email',
      });
      await store.setVerified(sid, 600);
      logger.info(
        {
          event: 'verify_otp',
          result: 'success',
          email: cur.email,
          sid,
        },
        'auth verify otp success'
      );
      return { verified: true };
    } catch {
      logger.warn(
        {
          event: 'verify_otp',
          result: 'failed',
          email: cur?.email,
          sid,
          err: { code: 'OTP_INVALID_OR_EXPIRED' },
        },
        'auth verify otp failed'
      );
      throw new JsonRpcAuthException(
        AuthErrorCode.OTP_INVALID_OR_EXPIRED,
        'OTP invalid or expired'
      );
    }
  }

  /**
   * 创建一次性 exchange_code
   */
  async createExchangeCode(
    dto: { app_id: string; redirect_uri: string; state?: string },
    req: Request
  ): Promise<{ code: string; redirect_uri: string; state?: string }> {
    const logger = getIdpBaseLogger().child({ module: 'auth' });
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
          email: cur.email,
          sid,
          app_id: dto.app_id,
          redirect_uri: dto.redirect_uri,
          err: { code: 'RATE_LIMITED' },
        },
        'auth create exchange code rate limited'
      );
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
    const code = crypto.randomBytes(32).toString('base64url');
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
        email: cur.email,
        sid,
        app_id: dto.app_id,
        redirect_uri: dto.redirect_uri,
      },
      'auth create exchange code success'
    );
    return { code, redirect_uri: dto.redirect_uri, state: dto.state };
  }

  /**
   * 获取用户的多因子配置列表
   */
  private async getMfaMethods(user: {
    id: number;
  }): Promise<{ mfa: IMethod[]; requiresMfa: boolean }> {
    const mfa: IMethod[] = [
      { type: MFAType.Email, enabled: false },
      { type: MFAType.Fido2, enabled: false },
      { type: MFAType.Otp, enabled: false },
    ];

    type MfaPick = MfaSettingsPick;

    const { data: mfaSettings, error } = await this.sda
      .service()
      .from('mfa_settings')
      .select(
        'sms_enabled,email_enabled,fido2_enabled,otp_enabled,phone_number,required'
      )
      .eq('user_id', user.id)
      .maybeSingle<MfaPick>();
    if (error) {
      throw new HttpException('Failed to load MFA settings', 500);
    }

    if (!mfaSettings) {
      return { mfa, requiresMfa: false };
    }

    return {
      mfa: [
        { type: MFAType.Email, enabled: !!mfaSettings.email_enabled },
        { type: MFAType.Fido2, enabled: !!mfaSettings.fido2_enabled },
        { type: MFAType.Otp, enabled: !!mfaSettings.otp_enabled },
      ],
      requiresMfa: false,
    };
  }

  /**
   * 获取 RSA 公钥与一次性标识
   * - 用于前端进行密码加密传输
   */
  async rsatoken(_params: RpcParams): Promise<RSATokenResult> {
    // 返回 RSA 公钥与短时 token，供前端进行密码加密传输
    return {
      publicKey: getPublicKey(),
      token: `rsat-${Date.now()}`,
    };
  }
  /**
   * 多因子认证（短信最小闭环）
   * - codeOrAssertion 非 6 位数字视为请求验证码
   * - 6 位数字视为校验验证码，成功则建立会话并进入 enter
   */
  async multifactor(_params: MultifactorDto, _res?: Response): Promise<Next> {
    throw new HttpException('Multifactor is not implemented', 501);
  }

  async session(uid?: number): Promise<SessionResult> {
    if (!uid) return { logged: false };
    type UserPick = {
      id: number;
      username: string | null;
      student_id: string | null;
    };
    const { data: user } = await this.sda
      .service()
      .from('user')
      .select('id,username,student_id')
      .eq('id', uid)
      .maybeSingle<UserPick>();
    return {
      logged: true,
      name: user?.username ?? undefined,
      student_id: user?.student_id ?? undefined,
    };
  }

  // 忘记密码：初始化
  async forgotInit(params: { email: string }): Promise<RecoveryInitResult> {
    const email = String(params.email ?? '').trim();
    type UserPick = {
      id: number;
      username: string | null;
      student_id: string | null;
      phone: string | null;
      email: string | null;
    };
    const { data: user } = await this.sda
      .service()
      .from('user')
      .select('id,username,student_id,phone,email')
      .eq('email', email)
      .maybeSingle<UserPick>();
    const methods: RecoveryMethod[] = [];
    if (!user) {
      return {
        student_id: '',
        methods: [],
      };
    }
    const { data: cfg } = await this.sda
      .service()
      .from('mfa_settings')
      .select(
        'sms_enabled,email_enabled,fido2_enabled,otp_enabled,phone_number'
      )
      .eq('user_id', user.id)
      .maybeSingle<MfaSettingsPick>();
    const boundPhone = user.phone ?? cfg?.phone_number ?? null;
    // SMS
    {
      const enabled = false;
      const reason = RecoveryUnavailableReason.NotImplemented;
      methods.push({
        type: MFAType.Sms,
        enabled,
        extra: boundPhone ?? undefined,
        reason,
      });
    }
    // Email（占位）
    {
      const boundEmail = user.email ?? null;
      const enabled = !!cfg?.email_enabled && !!boundEmail;
      const reason = !cfg?.email_enabled
        ? RecoveryUnavailableReason.MethodDisabled
        : !boundEmail
          ? RecoveryUnavailableReason.NotBoundEmail
          : RecoveryUnavailableReason.NotImplemented;
      methods.push({
        type: MFAType.Email,
        enabled: enabled && false,
        extra: boundEmail ?? undefined,
        reason,
      });
    }
    // 其他未实现
    methods.push({
      type: MFAType.Fido2,
      enabled: false,
      reason: RecoveryUnavailableReason.NotImplemented,
    });
    methods.push({
      type: MFAType.Otp,
      enabled: false,
      reason: RecoveryUnavailableReason.NotImplemented,
    });
    return {
      student_id: user.student_id ?? '',
      name: user.username ?? undefined,
      methods,
    };
  }

  // 忘记密码：触发验证码
  async forgotChallenge(_params: {
    type: string;
    studentId: string;
  }): Promise<Next> {
    throw new HttpException('Recovery via SMS not implemented', 501);
  }

  // 忘记密码：校验验证码并下发令牌
  async forgotVerify(_params: {
    type: string;
    studentId: string;
    code: string;
  }): Promise<VerifyResult> {
    throw new HttpException('Recovery via SMS not implemented', 501);
  }
  /**
   * 重置密码
   * - 使用 scrypt 生成新密码哈希并写入数据库
   * - 成功后进入多因子校验
   */
  async resetPassword(
    _params: ResetPasswordDto & { reason: ResetReason }
  ): Promise<Next> {
    type UserPick = { id: number; student_id: string | null };
    const { data: user } = await this.sda
      .service()
      .from('user')
      .select('id,student_id')
      .eq('student_id', _params.studentId)
      .maybeSingle<UserPick>();
    if (!user) throw new HttpException('User not found', 404);

    // 校验重置令牌（使用 TicketIssuer）
    const tokenVal = await this.resetTicketIssuer.verify(_params.resetToken);
    if (!tokenVal || Number(tokenVal) !== user.id) {
      throw new HttpException('Invalid reset token', 401);
    }
    const hashed = await hashPasswordScrypt(_params.newPassword);
    {
      const { error } = await this.sda.service().rpc('auth_reset_password', {
        p_student_id: _params.studentId,
        p_new_hash: hashed,
      });
      if (error) throw new HttpException('Reset password failed', 500);
    }
    // 标记令牌失效（消费令牌）
    await this.resetTicketIssuer.consume(_params.resetToken);
    // 改密成功后直接进入后续流程
    return { nextSteps: [AuthNextStep.Enter] };
  }

  async resetPasswordRequest(_params: { studentId: string }): Promise<Next> {
    throw new HttpException('Reset password via SMS not implemented', 501);
  }

  /**
   * 完成登录并处理授权码回调
   * - 若已存在授权请求，颁发一次性 code 并返回 redirectTo 或执行 302
   * - 同时建立 SSO 会话（Cookie）
   */
  async enter(
    params: EnterDto,
    res?: Response,
    uidFromSess?: number
  ): Promise<Next> {
    const ticket = params.ticket;
    let state = params.state;
    let auth: any = null;

    if (ticket) {
      auth = await this.oidcTicketIssuer.verify(ticket);
      if (auth) {
        state = auth.state;
      }
    }

    if (!auth && state) {
      auth = await this.oidcAuthReqIssuer.verify(state);
    }

    const studentId = params.studentId;
    type UserPickEnter = {
      id: number;
      username: string | null;
      student_id: string | null;
      status: string | null;
    };
    let user: UserPickEnter | null = null;
    if (studentId) {
      const q = await this.sda
        .service()
        .from('user')
        .select('id,username,student_id,status')
        .eq('student_id', studentId)
        .maybeSingle<UserPickEnter>();
      user = q.data ?? null;
    } else if (uidFromSess) {
      const q = await this.sda
        .service()
        .from('user')
        .select('id,username,student_id,status')
        .eq('id', uidFromSess)
        .maybeSingle<UserPickEnter>();
      user = q.data ?? null;
    } else {
      user = null;
    }

    getIdpLogger('auth-service').info(
      { studentId, uidFromSess, userId: user?.id },
      'Resolved user in enter'
    );

    const uid = user ? user.id : null;
    getIdpLogger('auth-service').info(
      { studentId, uidFromSess, userId: user?.id, uid },
      'Resolved final uid in enter'
    );

    if (res && uid !== null && uid !== undefined) {
      await this.sessionIssuer.issue(res, uid, SessionMode.Long);
    }

    if (!auth) {
      return { nextSteps: [AuthNextStep.Finish] };
    }

    if (uid === null || uid === undefined) {
      throw new HttpException('Unauthorized: session invalid', 401);
    }

    // 使用 TicketIssuer 发放授权码
    const code = await this.oidcCodeIssuer.issue({
      client_id: auth.client_id,
      redirect_uri: auth.redirect_uri,
      code_challenge: auth.code_challenge,
      sub: String(uid),
      nonce: auth.nonce,
      acr: 'mfa',
      amr: ['sms'],
      scope: auth.scope || 'openid',
    });

    const redirectTo = `${auth.redirect_uri}?code=${code}&state=${encodeURIComponent(String(state || ''))}`;
    if (res && params.redirectMode === 'http') {
      res.redirect(302, redirectTo);
      return { nextSteps: [AuthNextStep.Finish] };
    }
    return { nextSteps: [AuthNextStep.Finish], redirectTo };
  }

  /**
   * 根据会话获取多因子方法列表
   */
  async mfaMethodsBySession(sid?: string): Promise<IMethod[]> {
    if (!sid) return [];
    const uid = await this.sessionIssuer.get(sid);
    if (!uid) return [];

    type UserPick = {
      id: number;
      phone: string | null;
    };
    const { data: user } = await this.sda
      .service()
      .from('user')
      .select('id,phone')
      .eq('id', Number(uid))
      .maybeSingle<UserPick>();

    if (!user) return [];

    const { mfa } = await this.getMfaMethods(user);
    return mfa;
  }
}
