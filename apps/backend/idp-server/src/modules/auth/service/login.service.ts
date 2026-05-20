import {
  AuthApiException,
  AuthErrorCode,
} from '@common/errors/auth-error-codes';
import { SupabaseUserRepository } from '@csisp/dal';
import { getIdpBaseLogger } from '@infra/logger';
import { GotrueService } from '@infra/supabase';
import { Injectable } from '@nestjs/common';

import { LoginInternalDto } from '../dto/login-internal.dto';

@Injectable()
export class LoginService {
  constructor(
    private readonly gotrue: GotrueService,
    private readonly userRepository: SupabaseUserRepository
  ) {}

  async loginEmailPassword(dto: LoginInternalDto): Promise<{
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

      logger.info(
        {
          event: 'login',
          result: 'success',
          student_id: dto.student_id,
          email: authUser.email,
        },
        'auth login success'
      );
      return { supabaseSession };
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
