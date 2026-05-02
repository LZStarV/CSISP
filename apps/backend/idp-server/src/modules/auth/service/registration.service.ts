import {
  AuthApiException,
  AuthErrorCode,
} from '@common/errors/auth-error-codes';
import {
  CommonApiException,
  CommonErrorCode,
} from '@common/errors/common-error-codes';
import { config } from '@config';
import { SupabaseUserRepository } from '@csisp/dal';
import type { RedisKV } from '@csisp/redis-sdk';
import { REDIS_KV } from '@csisp/redis-sdk/nest';
import { GotrueService } from '@infra/supabase';
import { Injectable } from '@nestjs/common';
import { HttpStatus } from '@nestjs/common';
import { Inject } from '@nestjs/common';

import { RegisterDto } from '../dto/register.dto';
import { ResendSignupOtpDto } from '../dto/resend-signup-otp.dto';
import { VerifySignupOtpDto } from '../dto/verify-signup-otp.dto';

@Injectable()
export class RegistrationService {
  constructor(
    private readonly userRepository: SupabaseUserRepository,
    private readonly gotrue: GotrueService,
    @Inject(REDIS_KV) private readonly kv: RedisKV
  ) {}

  async register(
    dto: RegisterDto
  ): Promise<{ ok: true; next: 'verify_email' }> {
    await this.gotrue.signUp({
      email: dto.email,
      password: dto.password,
      data: {
        student_id: dto.student_id,
        ...(dto.display_name ? { display_name: dto.display_name } : {}),
      },
    });
    const ttl =
      Math.max(1, Number(config.auth.register.redisTtlMinutes || 60)) * 60;
    await this.kv.set(`reg:student:${dto.email}`, dto.student_id, ttl);
    return { ok: true, next: 'verify_email' };
  }

  async verifySignupOtp(dto: VerifySignupOtpDto): Promise<{ verified: true }> {
    try {
      await this.gotrue.verifyOtp({
        email: dto.email,
        token: dto.token,
        type: 'signup',
      });
    } catch {
      throw new AuthApiException(
        AuthErrorCode.OtpInvalidOrExpired,
        'OTP invalid or expired'
      );
    }
    await this.finalizeUserByEmail(dto.email);
    return { verified: true };
  }

  async resendSignupOtp(dto: ResendSignupOtpDto): Promise<{ ok: true }> {
    await this.gotrue.resendSignupOtp({ email: dto.email });
    return { ok: true };
  }

  private async finalizeUserByEmail(email: string): Promise<boolean> {
    const normalized = String(email ?? '').trim();
    if (!normalized) return false;
    const studentId = await this.kv.get(`reg:student:${normalized}`);
    if (!studentId) return false;
    const bySid = await this.userRepository.findByStudentId(String(studentId));
    if (bySid?.id) {
      try {
        await this.kv.del(`reg:student:${normalized}`);
      } catch {}
      return true;
    }
    try {
      await this.userRepository.create({ student_id: String(studentId) });
    } catch {
      throw new CommonApiException(
        CommonErrorCode.InternalError,
        'Finalize failed',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
    try {
      await this.kv.del(`reg:student:${normalized}`);
    } catch {}
    return true;
  }

  async findUserById(id: number) {
    return this.userRepository.findById(id);
  }
}
