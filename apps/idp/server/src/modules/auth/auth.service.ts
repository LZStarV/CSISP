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
    private readonly mfaSettingsModel: typeof MfaSettingsModel
  ) {}
  async rsatoken(_params: RpcParams): Promise<RSATokenResult> {
    // 返回 RSA 公钥与短时 token，供前端进行密码加密传输
    return new RSATokenResult({
      publicKey: getPublicKey(),
      token: `rsat-${Date.now()}`,
    });
  }

  async login(params: {
    studentId: string;
    password: string;
  }): Promise<LoginResult> {
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
    // 密码校验：优先 scrypt；兼容非 scrypt 存量（明文比较）
    const algo = (process.env.AUTH_HASH_ALGO ?? 'scrypt').toLowerCase();
    if (algo === 'scrypt') {
      const ok = await verifyPassword((user as any).password, dto.password);
      if (!ok) throw new HttpException('Invalid username or password', 401);
    } else {
      if ((user as any).password !== dto.password) {
        throw new HttpException('Invalid username or password', 401);
      }
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

    // 构建多因子列表（根据 mfa_settings 动态启用）
    let mfa: IMethod[] = [
      { type: MFAType.SMS, extra: user?.phone ?? undefined, enabled: true },
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

    // 返回进入多因子校验的指令
    return new LoginResult({
      next: ['multifactor'],
      multifactor: mfa,
    });
  }

  async multifactor(_params: {
    type: MFAType;
    codeOrAssertion: string;
    phoneOrEmail: string;
  }): Promise<Next> {
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
    const isSms =
      String(dto.type).toUpperCase() === 'SMS' ||
      dto.type === (MFAType as any).SMS;
    if (!isSms) return new Next({ next: ['enter'] });
    const logger = getIdpLogger('multifactor');
    const key = `idp:otp:${dto.phoneOrEmail}`;
    const code = dto.codeOrAssertion;
    // 非 6 位数字视为“请求验证码”；生成后写入 Redis（TTL 300s）
    const isRequest = code.length !== 6 || /\D/.test(code);
    if (isRequest) {
      const otp = String(Math.floor(100000 + Math.random() * 900000));
      await redisSet(key, otp, 300);
      logger.info({ method: 'sms', target: dto.phoneOrEmail });
      return new Next({ next: ['multifactor'] });
    }
    // 6 位数字视为“校验验证码”；比对 Redis 中的值
    const expected = await redisGet(key);
    if (!expected || expected !== code)
      throw new HttpException('Invalid verification code', 401);
    return new Next({ next: ['enter'] });
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
    // 完成登录：根据授权态颁发一次性授权码，并返回回调指令
    class EnterParamsDto {
      @IsString()
      @Length(1, 128)
      studentId!: string;
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
    const user = await (this.userModel as any).findOne({
      where: { student_id: dto.studentId },
      attributes: ['id', 'username', 'student_id', 'status'],
    });
    if (!user) throw new HttpException('User not found', 404);
    const auth = await redisGet(`oidc:authreq:${dto.state}`);
    if (!auth) throw new HttpException('Authorization state not found', 400);
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
        sub: (user as any).id,
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
}
