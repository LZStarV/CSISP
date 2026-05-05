import crypto from 'crypto';

import {
  AuthApiException,
  AuthErrorCode,
} from '@common/errors/auth-error-codes';
import { config } from '@config';
import { SupabaseUserRepository } from '@csisp/dal';
import type { RedisKV } from '@csisp/redis-sdk';
import { REDIS_KV } from '@csisp/redis-sdk/nest';
import { getIdpBaseLogger } from '@infra/logger';
import { StepUpStore } from '@infra/redis/stepup.store';
import { GotrueService } from '@infra/supabase';
import { Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import type { Response } from 'express';

import { LoginInternalDto } from '../dto/login-internal.dto';

@Injectable()
export class LoginService {
  constructor(
    private readonly gotrue: GotrueService,
    private readonly userRepository: SupabaseUserRepository,
    @Inject(REDIS_KV) private readonly kv: RedisKV
  ) {}

  async loginEmailPassword(
    dto: LoginInternalDto,
    res: Response
  ): Promise<{
    stepUp: 'PENDING_PASSWORD';
    supabaseSession: {
      access_token: string;
      refresh_token: string;
      expires_in: number;
    };
  }> {
    const logger = getIdpBaseLogger().child({ module: 'auth' });

    try {
      // 先通过 student_id 查询 public.user 表获取用户信息
      const user = await this.userRepository.findByStudentId(dto.student_id);
      if (!user || !user.auth_user_id) {
        logger.warn(
          {
            event: 'login',
            result: 'failed',
            student_id: dto.student_id,
            reason: 'user_not_found',
          },
          'auth login failed - user not found'
        );
        throw new AuthApiException(
          AuthErrorCode.Unauthorized,
          '学号或密码错误'
        );
      }

      // 通过 auth user ID 获取用户信息（包含 email）
      const authUser = await this.gotrue.getUserByAuthId(user.auth_user_id);
      if (!authUser || !authUser.email) {
        logger.warn(
          {
            event: 'login',
            result: 'failed',
            student_id: dto.student_id,
            reason: 'auth_user_not_found',
          },
          'auth login failed - auth user not found'
        );
        throw new AuthApiException(
          AuthErrorCode.Unauthorized,
          '学号或密码错误'
        );
      }

      // 使用用户的 email 验证密码，获取 Supabase session
      const supabaseSession = await this.gotrue.signInWithPassword({
        email: authUser.email,
        password: dto.password,
      });

      // 创建 step-up session
      const sid = crypto.randomUUID();
      const store = new StepUpStore(this.kv);
      await store.setPendingPassword(sid, authUser.email, 600);

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
          student_id: dto.student_id,
          email: authUser.email,
          sid,
        },
        'auth login success'
      );
      return { stepUp: 'PENDING_PASSWORD', supabaseSession };
    } catch (error) {
      if (error instanceof AuthApiException) {
        throw error;
      }
      logger.warn(
        { event: 'login', result: 'failed', student_id: dto.student_id },
        'auth login failed'
      );
      throw new AuthApiException(AuthErrorCode.Unauthorized, '学号或密码错误');
    }
  }
}
