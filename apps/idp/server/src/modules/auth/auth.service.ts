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
import { Injectable, HttpException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import type MfaSettings from '@pgtype/MfaSettings';
import type User from '@pgtype/User';
import { plainToInstance } from 'class-transformer';
import { IsString, Length, validateSync } from 'class-validator';
import type { Response } from 'express';

import {
  verifyPassword,
  hashPasswordScrypt,
} from '../../infra/crypto/password';
import { getPublicKey } from '../../infra/crypto/rsa';
import { getIdpLogger } from '../../infra/logger';
import { MfaSettingsModel } from '../../infra/postgres/models/mfa-settings.model';
import { UserModel } from '../../infra/postgres/models/user.model';
import { set as redisSet, get as redisGet } from '../../infra/redis';
import { SmsService } from '../../infra/sms/sms.service';

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
  constructor(
    @InjectModel(UserModel) private readonly userModel: typeof UserModel,
    @InjectModel(MfaSettingsModel)
    private readonly mfaSettingsModel: typeof MfaSettingsModel,
    private readonly smsService: SmsService
  ) {}
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
  async login(
    params: {
      studentId: string;
      password: string;
    },
    res?: Response
  ): Promise<LoginResult> {
    class LoginParamsDto {
      @IsString()
      @Length(1, 128)
      studentId!: string;
      @IsString()
      @Length(1, 512)
      password!: string;
    }
    // 参数校验（运行时）
    const dto = plainToInstance(LoginParamsDto, params);
    const errs = validateSync(dto, { whitelist: true });
    if (errs.length) throw new HttpException('Invalid params', 400);

    // 查询用户（按学号）
    type UserPick = Pick<
      User,
      'id' | 'username' | 'student_id' | 'phone' | 'password'
    >;
    const user = (await this.userModel.findOne({
      where: { student_id: dto.studentId },
      attributes: ['id', 'username', 'student_id', 'phone', 'password'],
      raw: true,
    })) as UserPick | null;
    if (!user) {
      throw new HttpException('Invalid username or password', 401);
    }

    // 首次登录分流：非 scrypt$ 前缀视为首次登录，要求重置密码
    const pwd: string = user.password ?? '';
    const isFirstLogin = !pwd.startsWith('scrypt$');
    if (isFirstLogin) {
      return new LoginResult({
        next: [AuthNextStep.ResetPassword],
        multifactor: [],
      });
    }

    // 密码校验：仅支持 scrypt$ 前缀的密码（未来可能支持 RSA 公钥加密后的密码）
    const ok = await verifyPassword(user.password, dto.password);
    if (!ok) throw new HttpException('Invalid username or password', 401);

    // 构建多因子列表（根据 mfa_settings 动态启用）
    // TODO：根据实际情况调整多因子列表（如 FIDO2 等）
    let mfa: IMethod[] = [
      {
        type: MFAType.Sms,
        extra: user.phone ?? undefined,
        enabled: true,
      },
      { type: MFAType.Email, enabled: false },
      { type: MFAType.Fido2, enabled: false },
      { type: MFAType.Otp, enabled: false },
    ];

    if (user) {
      type MfaPick = Pick<
        MfaSettings,
        | 'sms_enabled'
        | 'email_enabled'
        | 'fido2_enabled'
        | 'otp_enabled'
        | 'phone_number'
        | 'required'
      >;
      const mfaSettings = (await this.mfaSettingsModel.findOne({
        where: { user_id: user.id },
        attributes: [
          'sms_enabled',
          'email_enabled',
          'fido2_enabled',
          'otp_enabled',
          'phone_number',
          'required',
        ],
        raw: true,
      })) as MfaPick | null;
      if (mfaSettings) {
        mfa = [
          {
            type: MFAType.Sms,
            extra: user.phone ?? mfaSettings.phone_number ?? undefined,
            enabled: !!mfaSettings.sms_enabled,
          },
          { type: MFAType.Email, enabled: !!mfaSettings.email_enabled },
          { type: MFAType.Fido2, enabled: !!mfaSettings.fido2_enabled },
          { type: MFAType.Otp, enabled: !!mfaSettings.otp_enabled },
        ];
        // 根据 required 控制是否需要多因子登录
        const requiresMfa = !!mfaSettings.required;
        // 在 login 阶段建立会话：需要多因子则短期，否则直接长期
        if (res && user) {
          const sid =
            Math.random().toString(36).slice(2) + Date.now().toString(36);
          await redisSet(
            `idp:sess:${sid}`,
            String(user.id),
            requiresMfa ? 300 : 3600
          );
          res.cookie('idp_session', sid, {
            httpOnly: true,
            sameSite: 'lax',
          });
        }
        if (!requiresMfa) {
          return new LoginResult({
            next: [AuthNextStep.Enter],
            multifactor: mfa,
          });
        }
      }
    }

    // 在 login 阶段建立短期 SSO 会话（待完成多因子后升级）
    if (res && user) {
      const sid = Math.random().toString(36).slice(2) + Date.now().toString(36);
      await redisSet(`idp:sess:${sid}`, String(user.id), 300);
      res.cookie('idp_session', sid, {
        httpOnly: true,
        sameSite: 'lax',
      });
    }

    // 返回进入多因子校验的指令
    return new LoginResult({
      next: [AuthNextStep.Multifactor],
      multifactor: mfa,
    });
  }

  /**
   * 多因子认证（短信最小闭环）
   * - codeOrAssertion 非 6 位数字视为请求验证码
   * - 6 位数字视为校验验证码，成功则建立会话并进入 enter
   */
  async multifactor(
    params: {
      type: MFAType;
      codeOrAssertion: string;
      phoneOrEmail: string;
    },
    res?: Response
  ): Promise<Next> {
    // 多因子参数校验（最小闭环）：短信验证码请求与校验
    class MultifactorParamsDto {
      @IsString()
      @Length(1, 64)
      codeOrAssertion!: string;
      @IsString()
      @Length(0, 128)
      phoneOrEmail!: string;
    }
    const dto = plainToInstance(MultifactorParamsDto, params);
    const errs = validateSync(dto, { whitelist: true });
    if (errs.length) throw new HttpException('Invalid params', 400);
    const logger = getIdpLogger('multifactor');

    switch (params.type) {
      case MFAType.Sms: {
        const key = `idp:otp:${dto.phoneOrEmail}`;
        const code = dto.codeOrAssertion;
        const isRequest = code.length !== 6 || /\D/.test(code);
        if (isRequest) {
          logger.info({ method: 'sms', target: dto.phoneOrEmail });
          let api: unknown = null;
          if (dto.phoneOrEmail) {
            api = await this.smsService.sendOtp(dto.phoneOrEmail);
          }
          return new Next({ next: [AuthNextStep.Multifactor], sms: api ?? {} });
        }
        const ok = await this.smsService.verifyOtp(dto.phoneOrEmail, code);
        if (!ok) throw new HttpException('Invalid verification code', 401);
        if (res && dto.phoneOrEmail) {
          type UserPick = Pick<User, 'id' | 'phone'>;
          const user = (await this.userModel.findOne({
            where: { phone: dto.phoneOrEmail },
            attributes: ['id', 'phone'],
            raw: true,
          })) as UserPick | null;
          if (user) {
            const sid =
              Math.random().toString(36).slice(2) + Date.now().toString(36);
            await redisSet(`idp:sess:${sid}`, String(user.id), 3600);
            res.cookie('idp_session', sid, {
              httpOnly: true,
              sameSite: 'lax',
            });
          }
        }
        return new Next({ next: [AuthNextStep.Enter] });
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
    type UserPick = Pick<User, 'id' | 'username' | 'student_id'>;
    const user = (await this.userModel.findOne({
      where: { id: uid },
      attributes: ['id', 'username', 'student_id'],
      raw: true,
    })) as UserPick | null;
    return new SessionResult({
      logged: true,
      name: user?.username ?? undefined,
      student_id: user?.student_id ?? undefined,
    });
  }

  // 忘记密码：初始化
  async forgotInit(params: { studentId: string }): Promise<RecoveryInitResult> {
    const stu = String(params.studentId ?? '');
    type UserPick = Pick<
      User,
      'id' | 'username' | 'student_id' | 'phone' | 'email'
    >;
    const user = (await this.userModel.findOne({
      where: { student_id: stu },
      attributes: ['id', 'username', 'student_id', 'phone', 'email'],
      raw: true,
    })) as UserPick | null;
    const methods: RecoveryMethod[] = [];
    if (!user) {
      return new RecoveryInitResult({
        student_id: stu,
        methods: [],
      });
    }
    const cfg = (await this.mfaSettingsModel.findOne({
      where: { user_id: user.id },
      attributes: [
        'sms_enabled',
        'email_enabled',
        'fido2_enabled',
        'otp_enabled',
        'phone_number',
      ],
      raw: true,
    })) as Pick<
      MfaSettings,
      | 'sms_enabled'
      | 'email_enabled'
      | 'fido2_enabled'
      | 'otp_enabled'
      | 'phone_number'
    > | null;
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
      student_id: user.student_id,
      name: user.username,
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
    type UserPick = Pick<User, 'id' | 'student_id' | 'phone'>;
    const user = (await this.userModel.findOne({
      where: { student_id: stu },
      attributes: ['id', 'student_id', 'phone'],
      raw: true,
    })) as UserPick | null;
    const cfg = user
      ? ((await this.mfaSettingsModel.findOne({
          where: { user_id: user.id },
          attributes: ['phone_number'],
          raw: true,
        })) as Pick<MfaSettings, 'phone_number'> | null)
      : null;
    const boundPhone = user?.phone ?? cfg?.phone_number ?? null;
    let api: unknown = null;
    if (boundPhone) {
      api = await this.smsService.sendOtp(boundPhone);
    }
    return new Next({ next: [AuthNextStep.ResetPassword], sms: api ?? {} });
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
    type UserPick = Pick<User, 'id' | 'student_id' | 'phone'>;
    const user = (await this.userModel.findOne({
      where: { student_id: stu },
      attributes: ['id', 'student_id', 'phone'],
      raw: true,
    })) as UserPick | null;
    const cfg = user
      ? ((await this.mfaSettingsModel.findOne({
          where: { user_id: user.id },
          attributes: ['phone_number'],
          raw: true,
        })) as Pick<MfaSettings, 'phone_number'> | null)
      : null;
    const boundPhone = user?.phone ?? cfg?.phone_number ?? null;
    if (!boundPhone) throw new HttpException('No phone bound', 400);
    const ok = await this.smsService.verifyOtp(boundPhone, code);
    if (!ok) throw new HttpException('Invalid verification code', 401);
    const token = (
      Math.random().toString(36).slice(2) + Date.now().toString(36)
    ).slice(0, 32);
    // 这里暂以 Redis 存储令牌；如需持久化可改用 PasswordResetsModel
    if (user) {
      await redisSet(
        `idp:reset:${user.student_id}:${token}`,
        String(user.id),
        900
      );
    }
    return new VerifyResult({ ok: true, reset_token: token });
  }
  /**
   * 重置密码
   * - 使用 scrypt 生成新密码哈希并写入数据库
   * - 成功后进入多因子校验
   */
  async resetPassword(_params: {
    studentId: string;
    newPassword: string;
    reason: ResetReason;
    resetToken: string;
  }): Promise<Next> {
    // 重置密码：将新密码使用 scrypt 生成哈希并写入数据库
    class ResetPasswordDto {
      @IsString()
      @Length(1, 128)
      studentId!: string;
      @IsString()
      @Length(8, 64)
      newPassword!: string;
      @IsString()
      @Length(1, 128)
      resetToken!: string;
    }
    const dto = plainToInstance(ResetPasswordDto, _params);
    const errs = validateSync(dto, { whitelist: true });
    if (errs.length) throw new HttpException('Invalid params', 400);
    type UserPick = Pick<User, 'id' | 'student_id'>;
    const user = (await this.userModel.findOne({
      where: { student_id: dto.studentId },
      attributes: ['id', 'student_id'],
      raw: true,
    })) as UserPick | null;
    if (!user) throw new HttpException('User not found', 404);
    // 校验重置令牌（Redis）
    const tokenKey = `idp:reset:${user.student_id}:${dto.resetToken}`;
    const tokenVal = await redisGet(tokenKey);
    if (!tokenVal || Number(tokenVal) !== user.id) {
      throw new HttpException('Invalid reset token', 401);
    }
    const hashed = await hashPasswordScrypt(dto.newPassword);
    await this.userModel.update(
      { password: hashed },
      { where: { student_id: dto.studentId } }
    );
    // 标记令牌失效
    await redisSet(tokenKey, '0', 1);
    // 改密成功后进入多因子校验
    return new Next({ next: [AuthNextStep.Multifactor] });
  }

  async resetPasswordRequest(_params: { studentId: string }): Promise<Next> {
    class ResetPasswordReqDto {
      @IsString()
      @Length(1, 128)
      studentId!: string;
    }
    const dto = plainToInstance(ResetPasswordReqDto, _params);
    const errs = validateSync(dto, { whitelist: true });
    if (errs.length) throw new HttpException('Invalid params', 400);
    type UserPick = Pick<User, 'phone'>;
    const user = (await this.userModel.findOne({
      where: { student_id: dto.studentId },
      attributes: ['phone'],
      raw: true,
    })) as UserPick | null;
    const phone = user?.phone ?? null;
    let api: unknown = null;
    if (phone) {
      api = await this.smsService.sendOtp(phone);
    }
    return new Next({ next: [AuthNextStep.ResetPassword], sms: api ?? {} });
  }

  /**
   * 完成登录并处理授权码回调
   * - 若已存在授权请求，颁发一次性 code 并返回 redirectTo 或执行 302
   * - 同时建立 SSO 会话（Cookie）
   */
  async enter(_params: RpcParams, res?: Response): Promise<Next> {
    // 完成登录：建立 SSO 会话；如存在授权态则颁发一次性授权码并返回回调指令
    class EnterParamsDto {
      @IsString()
      @Length(1, 256)
      state!: string;
      @IsString()
      @Length(0, 16)
      redirectMode?: string;
      @IsString()
      @Length(1, 128)
      studentId?: string;
    }
    const dto = plainToInstance(EnterParamsDto, _params);
    const errs = validateSync(dto, { whitelist: true });
    if (errs.length) throw new HttpException('Invalid params', 400);
    const studentId = dto.studentId;
    type UserPick = Pick<User, 'id' | 'username' | 'student_id' | 'status'>;
    const user = studentId
      ? ((await this.userModel.findOne({
          where: { student_id: studentId },
          attributes: ['id', 'username', 'student_id', 'status'],
          raw: true,
        })) as UserPick | null)
      : null;
    const uid = user ? user.id : null;
    if (res && uid) {
      const sid = Math.random().toString(36).slice(2) + Date.now().toString(36);
      await redisSet(`idp:sess:${sid}`, String(uid), 3600);
      res.cookie('idp_session', sid, {
        httpOnly: true,
        sameSite: 'lax',
      });
    }
    const auth = await redisGet(`oidc:authreq:${dto.state}`);
    if (!auth) {
      return new Next({ next: [AuthNextStep.Finish] });
    }
    const obj = JSON.parse(auth);
    const code = (
      Math.random().toString(36).slice(2) + Date.now().toString(36)
    ).slice(0, 32);
    await redisSet(
      `oidc:code:${code}`,
      JSON.stringify({
        client_id: obj.client_id,
        redirect_uri: obj.redirect_uri,
        code_challenge: obj.code_challenge,
        sub: uid ?? 0,
        nonce: obj.nonce,
        acr: 'mfa',
        amr: ['sms'],
        scope: obj.scope || 'openid',
      }),
      600
    );
    const redirectTo = `${obj.redirect_uri}?code=${code}&state=${encodeURIComponent(dto.state)}`;
    if (res && dto.redirectMode === 'http') {
      res.redirect(302, redirectTo);
      return new Next({ next: [AuthNextStep.Finish] });
    }
    return new Next({ next: [AuthNextStep.Finish], redirectTo });
  }

  /**
   * 根据会话查询可用的多因子方法
   * - 默认开启短信，其他方法按 mfa_settings 动态启用
   */
  async mfaMethodsBySession(sid?: string): Promise<IMethod[]> {
    if (!sid) return [];
    const uid = await redisGet(`idp:sess:${sid}`);
    if (!uid) return [];
    type UserPick = Pick<User, 'id' | 'phone'>;
    const user = (await this.userModel.findOne({
      where: { id: Number(uid) },
      attributes: ['id', 'phone'],
      raw: true,
    })) as UserPick | null;
    if (!user) return [];
    let mfa: IMethod[] = [
      {
        type: MFAType.Sms,
        extra: (user as any).phone ?? undefined,
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
    >;
    const cfg = (await this.mfaSettingsModel.findOne({
      where: { user_id: user.id },
      attributes: [
        'sms_enabled',
        'email_enabled',
        'fido2_enabled',
        'otp_enabled',
        'phone_number',
      ],
      raw: true,
    })) as MfaPick | null;
    if (cfg) {
      mfa = [
        {
          type: MFAType.Sms,
          extra: user.phone ?? cfg.phone_number ?? undefined,
          enabled: !!cfg.sms_enabled,
        },
        { type: MFAType.Email, enabled: !!cfg.email_enabled },
        { type: MFAType.Fido2, enabled: !!cfg.fido2_enabled },
        { type: MFAType.Otp, enabled: !!cfg.otp_enabled },
      ];
    }
    return mfa;
  }
}
