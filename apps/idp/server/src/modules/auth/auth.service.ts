import { Next, MFAType, IMethod } from '@csisp/idl/idp';
import { LoginResult, RSATokenResult, ResetReason } from '@csisp/idl/idp';
import { Injectable, HttpException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
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

// 登录参数说明：
// - 使用 studentId + password 进行账号密码登录
// - password 在前端通过 rsatoken 返回的 RSA 公钥进行加密传输（服务端按需解密后校验）
class LoginParamsDto {
  @IsString()
  @Length(1, 128)
  studentId!: string;
  @IsString()
  @Length(1, 512)
  password!: string;
}

@Injectable()
// 认证服务：
// - rsatoken：返回 RSA 公钥与短时 token
// - login：账号密码校验 + 首次登录分流（reset_password）或进入多因子（multifactor）
// - multifactor：短信验证码最小闭环（请求/校验），后续进入 enter
// - reset_password：使用 scrypt 进行改密并写库
// - enter：签发访问/刷新令牌（HS256）并通过 Cookie 下发
export class AuthService {
  constructor(
    @InjectModel(UserModel) private readonly userModel: typeof UserModel,
    @InjectModel(MfaSettingsModel)
    private readonly mfaSettingsModel: typeof MfaSettingsModel,
    private readonly smsService: SmsService
  ) {}
  async rsatoken(_params: RpcParams): Promise<RSATokenResult> {
    // 返回 RSA 公钥与短时 token，供前端进行密码加密传输
    return new RSATokenResult({
      publicKey: getPublicKey(),
      token: `rsat-${Date.now()}`,
    });
  }

  async login(
    params: {
      studentId: string;
      password: string;
    },
    res?: Response
  ): Promise<LoginResult> {
    // 参数校验（运行时）
    const dto = plainToInstance(LoginParamsDto, params);
    const errs = validateSync(dto, { whitelist: true });
    if (errs.length) throw new HttpException('Invalid params', 400);
    // 查询用户（按学号）
    const user = await (this.userModel as any).findOne({
      where: { student_id: dto.studentId },
      attributes: ['id', 'username', 'student_id', 'phone', 'password'],
    });
    if (!user) {
      throw new HttpException('Invalid username or password', 401);
    }
    // 首次登录分流：非 scrypt$ 前缀视为首次登录，要求重置密码
    const pwd: string = (user as any).password ?? '';
    const isFirstLogin = !pwd.startsWith('scrypt$');
    if (isFirstLogin) {
      return new LoginResult({
        next: ['reset_password'],
        multifactor: [],
      });
    }
    // 密码校验：仅支持 scrypt$ 前缀的密码（未来可能支持 RSA 公钥加密后的密码）
    const ok = await verifyPassword((user as any).password, dto.password);
    if (!ok) throw new HttpException('Invalid username or password', 401);

    // 构建多因子列表（根据 mfa_settings 动态启用）
    // TODO：根据实际情况调整多因子列表（如 FIDO2 等）
    let mfa: IMethod[] = [
      {
        type: MFAType.SMS,
        extra: user.phone ?? undefined,
        enabled: true,
      },
      { type: MFAType.EMAIL, enabled: false },
      { type: MFAType.FIDO2, enabled: false },
      { type: MFAType.OTP, enabled: false },
    ];

    if (user) {
      const cfg = await (this.mfaSettingsModel as any).findOne({
        where: { user_id: (user as any).id },
        attributes: [
          'sms_enabled',
          'email_enabled',
          'fido2_enabled',
          'otp_enabled',
          'phone_number',
        ],
      });
      if (cfg) {
        mfa = [
          {
            type: MFAType.SMS,
            extra:
              (user as any).phone ?? (cfg as any).phone_number ?? undefined,
            enabled: !!(cfg as any).sms_enabled,
          },
          { type: MFAType.EMAIL, enabled: !!(cfg as any).email_enabled },
          { type: MFAType.FIDO2, enabled: !!(cfg as any).fido2_enabled },
          { type: MFAType.OTP, enabled: !!(cfg as any).otp_enabled },
        ];
      }
    }

    // 在 login 阶段建立短期 SSO 会话（待完成多因子后升级）
    if (res) {
      const sid = Math.random().toString(36).slice(2) + Date.now().toString(36);
      await redisSet(`idp:sess:${sid}`, String((user as any).id), 300);
      (res as any).cookie('idp_session', sid, {
        httpOnly: true,
        sameSite: 'lax',
      });
    }
    // 返回进入多因子校验的指令
    return new LoginResult({
      next: ['multifactor'],
      multifactor: mfa,
    });
  }

  async multifactor(
    _params: {
      type: MFAType;
      codeOrAssertion: string;
      phoneOrEmail: string;
    },
    res?: Response
  ): Promise<Next> {
    // 多因子参数校验（最小闭环）：短信验证码请求与校验
    class MultifactorParamsDto {
      @IsString()
      type!: string;
      @IsString()
      @Length(1, 64)
      codeOrAssertion!: string;
      @IsString()
      @Length(0, 128)
      phoneOrEmail!: string;
    }
    const dto = plainToInstance(MultifactorParamsDto, _params);
    const errs = validateSync(dto, { whitelist: true });
    if (errs.length) throw new HttpException('Invalid params', 400);
    const t = String(dto.type).toUpperCase();
    const logger = getIdpLogger('multifactor');
    switch (t) {
      case 'SMS': {
        const key = `idp:otp:${dto.phoneOrEmail}`;
        const code = dto.codeOrAssertion;
        const isRequest = code.length !== 6 || /\D/.test(code);
        if (isRequest) {
          logger.info({ method: 'sms', target: dto.phoneOrEmail });
          let api: any = null;
          if (dto.phoneOrEmail) {
            api = await this.smsService.sendOtp(dto.phoneOrEmail);
          }
          return new Next({ next: ['multifactor'], sms: api ?? {} });
        }
        const expected = await redisGet(key);
        if (!expected || expected !== code)
          throw new HttpException('Invalid verification code', 401);
        if (res && dto.phoneOrEmail) {
          const user = await (this.userModel as any).findOne({
            where: { phone: dto.phoneOrEmail },
            attributes: ['id', 'phone'],
          });
          if (user) {
            const sid =
              Math.random().toString(36).slice(2) + Date.now().toString(36);
            await redisSet(`idp:sess:${sid}`, String((user as any).id), 3600);
            (res as any).cookie('idp_session', sid, {
              httpOnly: true,
              sameSite: 'lax',
            });
          }
        }
        return new Next({ next: ['enter'] });
      }
      case 'EMAIL': {
        throw new HttpException('MFA method email not supported', 400);
      }
      case 'FIDO2': {
        throw new HttpException('MFA method fido2 not supported', 400);
      }
      case 'OTP': {
        throw new HttpException('MFA method otp not supported', 400);
      }
      default: {
        throw new HttpException('MFA method not supported', 400);
      }
    }
  }

  async resetPassword(_params: {
    studentId: string;
    newPassword: string;
    reason: ResetReason;
  }): Promise<Next> {
    // 重置密码：将新密码使用 scrypt 生成哈希并写入数据库
    class ResetPasswordDto {
      @IsString()
      @Length(1, 128)
      studentId!: string;
      @IsString()
      @Length(8, 64)
      newPassword!: string;
    }
    const dto = plainToInstance(ResetPasswordDto, _params);
    const errs = validateSync(dto, { whitelist: true });
    if (errs.length) throw new HttpException('Invalid params', 400);
    const user = await (this.userModel as any).findOne({
      where: { student_id: dto.studentId },
      attributes: ['id', 'student_id'],
    });
    if (!user) throw new HttpException('User not found', 404);
    const hashed = await hashPasswordScrypt(dto.newPassword);
    await (this.userModel as any).update(
      { password: hashed },
      { where: { student_id: dto.studentId } }
    );
    // 改密成功后进入多因子校验
    return new Next({ next: ['multifactor'] });
  }

  async enter(_params: RpcParams, res?: Response): Promise<Next> {
    // 完成登录：建立 SSO 会话；如存在授权态则颁发一次性授权码并返回回调指令
    class EnterParamsDto {
      @IsString()
      @Length(1, 256)
      state!: string;
      @IsString()
      @Length(0, 16)
      redirectMode?: string;
    }
    const dto = plainToInstance(EnterParamsDto, _params);
    const errs = validateSync(dto, { whitelist: true });
    if (errs.length) throw new HttpException('Invalid params', 400);
    const studentId = (_params as any).studentId;
    const user = studentId
      ? await (this.userModel as any).findOne({
          where: { student_id: studentId },
          attributes: ['id', 'username', 'student_id', 'status'],
        })
      : null;
    const uid = user ? (user as any).id : null;
    if (res && uid) {
      const sid = Math.random().toString(36).slice(2) + Date.now().toString(36);
      await redisSet(`idp:sess:${sid}`, String(uid), 3600);
      (res as any).cookie('idp_session', sid, {
        httpOnly: true,
        sameSite: 'lax',
      });
    }
    const auth = await redisGet(`oidc:authreq:${dto.state}`);
    if (!auth) {
      return new Next({ next: ['finish'] });
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
      (res as any).redirect(302, redirectTo);
      return new Next({ next: ['finish'] });
    }
    return { next: ['finish'], redirectTo } as any;
  }

  async mfaMethodsBySession(sid?: string): Promise<IMethod[]> {
    if (!sid) return [];
    const uid = await redisGet(`idp:sess:${sid}`);
    if (!uid) return [];
    const user = await (this.userModel as any).findOne({
      where: { id: Number(uid) },
      attributes: ['id', 'phone'],
    });
    if (!user) return [];
    let mfa: IMethod[] = [
      {
        type: MFAType.SMS,
        extra: (user as any).phone ?? undefined,
        enabled: true,
      },
      { type: MFAType.EMAIL, enabled: false },
      { type: MFAType.FIDO2, enabled: false },
      { type: MFAType.OTP, enabled: false },
    ];
    const cfg = await (this.mfaSettingsModel as any).findOne({
      where: { user_id: (user as any).id },
      attributes: [
        'sms_enabled',
        'email_enabled',
        'fido2_enabled',
        'otp_enabled',
        'phone_number',
      ],
    });
    if (cfg) {
      mfa = [
        {
          type: MFAType.SMS,
          extra: (user as any).phone ?? (cfg as any).phone_number ?? undefined,
          enabled: !!(cfg as any).sms_enabled,
        },
        { type: MFAType.EMAIL, enabled: !!(cfg as any).email_enabled },
        { type: MFAType.FIDO2, enabled: !!(cfg as any).fido2_enabled },
        { type: MFAType.OTP, enabled: !!(cfg as any).otp_enabled },
      ];
    }
    return mfa;
  }
}
