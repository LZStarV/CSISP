import { Next, MFAType, IMethod } from '@csisp/idl/idp';
import { LoginResult, RSATokenResult, ResetReason } from '@csisp/idl/idp';
import { Injectable, HttpException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { plainToInstance } from 'class-transformer';
import { IsString, Length, validateSync } from 'class-validator';
import type { Response } from 'express';

import { signHS256, parseDurationToSeconds } from '../../infra/crypto/jwt';
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

class LoginParamsDto {
  @IsString()
  @Length(1, 128)
  studentId!: string;
  @IsString()
  @Length(1, 512)
  password!: string;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(UserModel) private readonly userModel: typeof UserModel,
    @InjectModel(MfaSettingsModel)
    private readonly mfaSettingsModel: typeof MfaSettingsModel
  ) {}
  async rsatoken(_params: RpcParams): Promise<RSATokenResult> {
    return new RSATokenResult({
      publicKey: getPublicKey(),
      token: `rsat-${Date.now()}`,
    });
  }

  async login(params: {
    studentId: string;
    password: string;
  }): Promise<LoginResult> {
    const dto = plainToInstance(LoginParamsDto, params);
    const errs = validateSync(dto, { whitelist: true });
    if (errs.length) throw new HttpException('Invalid params', 400);
    const user = await (this.userModel as any).findOne({
      where: { student_id: dto.studentId },
      attributes: ['id', 'username', 'student_id', 'phone', 'password'],
    });
    if (!user) {
      throw new HttpException('Invalid username or password', 401);
    }
    const algo = (process.env.AUTH_HASH_ALGO ?? 'scrypt').toLowerCase();
    if (algo === 'scrypt') {
      const ok = await verifyPassword((user as any).password, dto.password);
      if (!ok) throw new HttpException('Invalid username or password', 401);
    } else {
      if ((user as any).password !== dto.password) {
        throw new HttpException('Invalid username or password', 401);
      }
    }
    const pwd: string = (user as any).password ?? '';
    const isFirstLogin = !pwd.startsWith('scrypt$');
    if (isFirstLogin) {
      return new LoginResult({
        next: ['reset_password'],
        multifactor: [],
      });
    }

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
    const isRequest = code.length !== 6 || /\D/.test(code);
    if (isRequest) {
      const otp = String(Math.floor(100000 + Math.random() * 900000));
      await redisSet(key, otp, 300);
      logger.info({ method: 'sms', target: dto.phoneOrEmail });
      return new Next({ next: ['multifactor'] });
    }
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
    return new Next({ next: ['multifactor'] });
  }

  async enter(_params: RpcParams, res?: Response): Promise<Next> {
    class EnterParamsDto {
      @IsString()
      @Length(1, 128)
      studentId!: string;
    }
    const dto = plainToInstance(EnterParamsDto, _params);
    const errs = validateSync(dto, { whitelist: true });
    if (errs.length) throw new HttpException('Invalid params', 400);
    const user = await (this.userModel as any).findOne({
      where: { student_id: dto.studentId },
      attributes: ['id', 'username', 'student_id', 'status'],
    });
    if (!user) throw new HttpException('User not found', 404);
    const secret = process.env.JWT_SECRET || 'local-dev-do-not-use';
    const accessExp = parseDurationToSeconds(
      process.env.JWT_EXPIRES_IN || '1h',
      3600
    );
    const refreshExp = parseDurationToSeconds(
      process.env.JWT_REFRESH_EXPIRES_IN || '7d',
      604800
    );
    const accessToken = signHS256(
      {
        sub: (user as any).id,
        username: (user as any).username,
        studentId: (user as any).student_id,
        scope: 'idp',
      },
      secret,
      accessExp
    );
    const refreshToken = signHS256(
      { sub: (user as any).id, t: 'refresh' },
      secret,
      refreshExp
    );
    if (res) {
      const isDev = (process.env.NODE_ENV || 'development') === 'development';
      const cookieCommon = {
        httpOnly: true,
        secure: !isDev,
        sameSite: 'lax' as const,
        path: '/',
      };
      (res as any).cookie('IDP_AT', accessToken, {
        ...cookieCommon,
        maxAge: accessExp * 1000,
      });
      (res as any).cookie('IDP_RT', refreshToken, {
        ...cookieCommon,
        maxAge: refreshExp * 1000,
      });
    }
    return new Next({ next: ['finish'] });
  }
}
