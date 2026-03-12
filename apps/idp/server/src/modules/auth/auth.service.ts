import {
  Next,
  MFAType,
  IMethod,
  AuthNextStep,
  LoginResult,
  RSATokenResult,
  ResetReason,
} from '@csisp/idl/idp';
import { SessionResult } from '@csisp/idl/idp';
import {
  RecoveryInitResult,
  RecoveryMethod,
  VerifyResult,
  RecoveryUnavailableReason,
} from '@csisp/idl/idp';
import type MfaSettings from '@csisp/infra-database/public/MfaSettings';
import type User from '@csisp/infra-database/public/User';
import { RedisPrefix } from '@idp-types/redis';
import { verifyPassword, hashPasswordScrypt } from '@infra/crypto/password';
import { getPublicKey } from '@infra/crypto/rsa';
import { getIdpLogger } from '@infra/logger';
import { MfaSettingsModel, UserModel } from '@infra/postgres/models';
import { SmsService } from '@infra/sms/sms.service';
import { SupabaseDataAccess } from '@infra/supabase';
import { Injectable, HttpException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import {
  SessionIssuer,
  defaultSessionOptions,
  SessionMode,
} from '@utils/session.issuer';
import { TicketIssuer, TicketIdType } from '@utils/ticket.issuer';
import type { Response } from 'express';

import { EnterDto } from './dto/enter.dto';
import { LoginDto } from './dto/login.dto';
import { MultifactorDto } from './dto/multifactor.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

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
  private readonly sessionIssuer = new SessionIssuer(defaultSessionOptions);
  private readonly resetTicketIssuer = new TicketIssuer({
    prefix: RedisPrefix.IdpReset,
    ttl: 900,
  });

  private readonly oidcTicketIssuer = new TicketIssuer<any>({
    prefix: RedisPrefix.OidcTicket,
    ttl: 600,
    idType: TicketIdType.UUID,
  });

  private readonly oidcAuthReqIssuer = new TicketIssuer<any>({
    prefix: RedisPrefix.OidcAuthReq,
    ttl: 600,
  });

  private readonly oidcCodeIssuer = new TicketIssuer<any>({
    prefix: RedisPrefix.OidcCode,
    ttl: 600,
  });

  constructor(
    @InjectModel(UserModel) private readonly userModel: typeof UserModel,
    @InjectModel(MfaSettingsModel)
    private readonly mfaSettingsModel: typeof MfaSettingsModel,
    private readonly smsService: SmsService,
    private readonly sda: SupabaseDataAccess
  ) {}

  /**
   * 获取用户的多因子配置列表
   */
  private async getMfaMethods(user: {
    id: number;
    phone?: string | null;
  }): Promise<{ mfa: IMethod[]; requiresMfa: boolean }> {
    // 默认列表
    const mfa: IMethod[] = [
      {
        type: MFAType.Sms,
        extra: user.phone ?? undefined,
        enabled: true,
      },
      { type: MFAType.Email, enabled: false },
      { type: MFAType.Fido2, enabled: false },
      { type: MFAType.Otp, enabled: false },
    ];

    type MfaPick = Pick<
      MfaSettings,
      | 'sms_enabled'
      | 'email_enabled'
      | 'fido2_enabled'
      | 'otp_enabled'
      | 'phone_number'
      | 'required'
    >;

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
        {
          type: MFAType.Sms,
          extra: user.phone ?? mfaSettings.phone_number ?? undefined,
          enabled: !!mfaSettings.sms_enabled,
        },
        { type: MFAType.Email, enabled: !!mfaSettings.email_enabled },
        { type: MFAType.Fido2, enabled: !!mfaSettings.fido2_enabled },
        { type: MFAType.Otp, enabled: !!mfaSettings.otp_enabled },
      ],
      requiresMfa: !!mfaSettings.required,
    };
  }

  /**
   * 获取 RSA 公钥与一次性标识
   * - 用于前端进行密码加密传输
   */
  async rsatoken(_params: RpcParams): Promise<RSATokenResult> {
    // 返回 RSA 公钥与短时 token，供前端进行密码加密传输
    return new RSATokenResult({
      publicKey: getPublicKey(),
      token: `rsat-${Date.now()}`,
    });
  }

  /**
   * 账号密码登录
   * - 校验用户是否首次登录（非 scrypt$ 前缀需重置密码）
   * - 校验密码通过后生成短期会话并返回多因子列表
   */
  async login(params: LoginDto, res?: Response): Promise<LoginResult> {
    const logger = getIdpLogger('auth-login');
    // 查询用户（按学号）
    type UserPick = {
      id: number;
      username: string | null;
      student_id: string | null;
      phone: string | null;
      password: string | null;
    };
    const { data: user, error: userErr } = await this.sda
      .service()
      .from('user')
      .select('id,username,student_id,phone,password')
      .eq('student_id', params.studentId)
      .maybeSingle<UserPick>();
    logger.info(
      {
        studentId: params.studentId,
        found: !!user,
        userId: user?.id,
        fetchError: userErr
          ? String(userErr.message ?? userErr.code ?? 'err')
          : undefined,
      },
      'login user fetched'
    );
    if (userErr) {
      throw new HttpException('Invalid username or password', 401);
    }
    if (!user) {
      throw new HttpException('Invalid username or password', 401);
    }

    // 首次登录分流：非 scrypt$ 前缀视为首次登录，要求重置密码
    const pwd: string = user.password ?? '';
    const isFirstLogin = !pwd.startsWith('scrypt$');
    logger.info(
      { userId: user.id, isFirstLogin, pwdPref: pwd.slice(0, 6) },
      'login first-login check'
    );
    if (isFirstLogin) {
      return new LoginResult({
        nextSteps: [AuthNextStep.ResetPassword],
        multifactor: [],
      });
    }

    // 密码校验：仅支持 scrypt$ 前缀的密码（未来可能支持 RSA 公钥加密后的密码）
    const ok = await verifyPassword(pwd, params.password);
    if (!ok) {
      logger.warn(
        { userId: user.id, reason: 'password_mismatch' },
        'login failed'
      );
    } else {
      logger.info({ userId: user.id }, 'password verified');
    }
    if (!ok) throw new HttpException('Invalid username or password', 401);

    // 构建多因子列表（根据 mfa_settings 动态启用）
    const { mfa, requiresMfa } = await this.getMfaMethods(user);

    // 在 login 阶段建立会话：需要多因子则短期，否则直接长期
    if (res) {
      await this.sessionIssuer.issue(
        res,
        user.id,
        requiresMfa ? SessionMode.Short : SessionMode.Long
      );
    }

    if (!requiresMfa) {
      return new LoginResult({
        nextSteps: [AuthNextStep.Enter],
        multifactor: mfa,
      });
    }

    // 返回进入多因子校验的指令
    return new LoginResult({
      nextSteps: [AuthNextStep.Multifactor],
      multifactor: mfa,
    });
  }

  /**
   * 多因子认证（短信最小闭环）
   * - codeOrAssertion 非 6 位数字视为请求验证码
   * - 6 位数字视为校验验证码，成功则建立会话并进入 enter
   */
  async multifactor(params: MultifactorDto, res?: Response): Promise<Next> {
    const logger = getIdpLogger('multifactor');

    switch (params.type) {
      case MFAType.Sms: {
        const code = params.codeOrAssertion;
        const isRequest = code.length !== 6 || /\D/.test(code);
        if (isRequest) {
          logger.info({ method: 'sms', target: params.phoneOrEmail });
          let api: unknown = null;
          if (params.phoneOrEmail) {
            api = await this.smsService.sendOtp(params.phoneOrEmail);
          }
          return new Next({
            nextSteps: [AuthNextStep.Multifactor],
            sms: api ?? {},
          });
        }
        const ok = await this.smsService.verifyOtp(
          params.phoneOrEmail ?? '',
          code
        );
        if (!ok) throw new HttpException('Invalid verification code', 401);
        if (res && params.phoneOrEmail) {
          type UserPick = { id: number; phone: string | null };
          const { data: user } = await this.sda
            .service()
            .from('user')
            .select('id,phone')
            .eq('phone', params.phoneOrEmail)
            .maybeSingle<UserPick>();
          if (user && user.id) {
            await this.sessionIssuer.issue(res, user.id, SessionMode.Long);
          }
        }
        return new Next({ nextSteps: [AuthNextStep.Enter] });
      }
      case MFAType.Email: {
        throw new HttpException('MFA method email not supported', 400);
      }
      case MFAType.Fido2: {
        throw new HttpException('MFA method fido2 not supported', 400);
      }
      case MFAType.Otp: {
        throw new HttpException('MFA method otp not supported', 400);
      }
      default: {
        throw new HttpException('MFA method not supported', 400);
      }
    }
  }

  async session(uid?: number): Promise<SessionResult> {
    if (!uid) return new SessionResult({ logged: false });
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
    return new SessionResult({
      logged: true,
      name: user?.username ?? undefined,
      student_id: user?.student_id ?? undefined,
    });
  }

  // 忘记密码：初始化
  async forgotInit(params: { studentId: string }): Promise<RecoveryInitResult> {
    const stu = String(params.studentId ?? '');
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
      .eq('student_id', stu)
      .maybeSingle<UserPick>();
    const methods: RecoveryMethod[] = [];
    if (!user) {
      return new RecoveryInitResult({
        student_id: stu,
        methods: [],
      });
    }
    const { data: cfg } = await this.sda
      .service()
      .from('mfa_settings')
      .select(
        'sms_enabled,email_enabled,fido2_enabled,otp_enabled,phone_number'
      )
      .eq('user_id', user.id)
      .maybeSingle<
        Pick<
          MfaSettings,
          | 'sms_enabled'
          | 'email_enabled'
          | 'fido2_enabled'
          | 'otp_enabled'
          | 'phone_number'
        >
      >();
    const boundPhone = user.phone ?? cfg?.phone_number ?? null;
    // SMS
    {
      const enabled = !!cfg?.sms_enabled && !!boundPhone;
      const reason = !cfg?.sms_enabled
        ? RecoveryUnavailableReason.MethodDisabled
        : !boundPhone
          ? RecoveryUnavailableReason.NotBoundPhone
          : undefined;
      methods.push(
        new RecoveryMethod({
          type: MFAType.Sms,
          enabled,
          extra: boundPhone ?? undefined,
          reason,
        })
      );
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
      methods.push(
        new RecoveryMethod({
          type: MFAType.Email,
          enabled: enabled && false, // 暂未实现
          extra: boundEmail ?? undefined,
          reason,
        })
      );
    }
    // 其他未实现
    methods.push(
      new RecoveryMethod({
        type: MFAType.Fido2,
        enabled: false,
        reason: RecoveryUnavailableReason.NotImplemented,
      })
    );
    methods.push(
      new RecoveryMethod({
        type: MFAType.Otp,
        enabled: false,
        reason: RecoveryUnavailableReason.NotImplemented,
      })
    );
    return new RecoveryInitResult({
      student_id: user.student_id ?? undefined,
      name: user.username ?? undefined,
      methods,
    });
  }

  // 忘记密码：触发验证码
  async forgotChallenge(params: {
    type: string;
    studentId: string;
  }): Promise<Next> {
    const typeStr = String(params.type ?? 'sms').toLowerCase();
    const stu = String(params.studentId ?? '');
    if (typeStr !== 'sms') {
      throw new HttpException('Recovery method not supported', 400);
    }
    type UserPick = {
      id: number;
      student_id: string | null;
      phone: string | null;
    };
    const { data: user } = await this.sda
      .service()
      .from('user')
      .select('id,student_id,phone')
      .eq('student_id', stu)
      .maybeSingle<UserPick>();
    const { data: cfg } = user
      ? await this.sda
          .service()
          .from('mfa_settings')
          .select('phone_number')
          .eq('user_id', user.id)
          .maybeSingle<Pick<MfaSettings, 'phone_number'>>()
      : { data: null as any };
    const boundPhone = user?.phone ?? cfg?.phone_number ?? null;
    let api: unknown = null;
    if (boundPhone) {
      api = await this.smsService.sendOtp(boundPhone);
    }
    return new Next({
      nextSteps: [AuthNextStep.ResetPassword],
      sms: api ?? {},
    });
  }

  // 忘记密码：校验验证码并下发令牌
  async forgotVerify(params: {
    type: string;
    studentId: string;
    code: string;
  }): Promise<VerifyResult> {
    const typeStr = String(params.type ?? 'sms').toLowerCase();
    const stu = String(params.studentId ?? '');
    const code = String(params.code ?? '');
    if (typeStr !== 'sms') {
      throw new HttpException('Recovery method not supported', 400);
    }
    type UserPick2 = {
      id: number;
      student_id: string | null;
      phone: string | null;
    };
    const { data: user } = await this.sda
      .service()
      .from('user')
      .select('id,student_id,phone')
      .eq('student_id', stu)
      .maybeSingle<UserPick2>();
    const { data: cfg } = user
      ? await this.sda
          .service()
          .from('mfa_settings')
          .select('phone_number')
          .eq('user_id', user.id)
          .maybeSingle<Pick<MfaSettings, 'phone_number'>>()
      : { data: null as any };
    const boundPhone = user?.phone ?? cfg?.phone_number ?? null;
    if (!boundPhone) throw new HttpException('No phone bound', 400);
    const ok = await this.smsService.verifyOtp(boundPhone, code);
    if (!ok) throw new HttpException('Invalid verification code', 401);

    // 使用 TicketIssuer 发放重置令牌
    let token = '';
    if (user) {
      // 生成随机标识并绑定学号前缀，确保令牌的唯一性与归属性
      const randomToken =
        Math.random().toString(36).slice(2) + Date.now().toString(36);
      token = await this.resetTicketIssuer.issue(
        String(user.id),
        `${user.student_id}:${randomToken}`
      );
    }
    return new VerifyResult({ ok: true, reset_token: token });
  }
  /**
   * 重置密码
   * - 使用 scrypt 生成新密码哈希并写入数据库
   * - 成功后进入多因子校验
   */
  async resetPassword(
    _params: ResetPasswordDto & { reason: ResetReason }
  ): Promise<Next> {
    type UserPick = Pick<User, 'id' | 'student_id'>;
    const user = (await this.userModel.findOne({
      where: { student_id: _params.studentId },
      attributes: ['id', 'student_id'],
      raw: true,
    })) as UserPick | null;
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
    // 改密成功后进入多因子校验
    return new Next({ nextSteps: [AuthNextStep.Multifactor] });
  }

  async resetPasswordRequest(_params: { studentId: string }): Promise<Next> {
    const studentId = String(_params.studentId ?? '').trim();
    if (!studentId) throw new HttpException('Invalid params', 400);
    type UserPick3 = {
      phone: string | null;
    };
    const { data: row } = await this.sda
      .service()
      .from('user')
      .select('phone')
      .eq('student_id', studentId)
      .maybeSingle<UserPick3>();
    const phone = row?.phone ?? null;
    let api: unknown = null;
    if (phone) {
      api = await this.smsService.sendOtp(phone);
    }
    return new Next({
      nextSteps: [AuthNextStep.ResetPassword],
      sms: api ?? {},
    });
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
      return new Next({ nextSteps: [AuthNextStep.Finish] });
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
      return new Next({ nextSteps: [AuthNextStep.Finish] });
    }
    return new Next({ nextSteps: [AuthNextStep.Finish], redirectTo });
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
