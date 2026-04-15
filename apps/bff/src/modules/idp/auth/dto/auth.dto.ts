import type {
  RegisterDto as ApiRegisterDto,
  LoginInternalDto as ApiLoginInternalDto,
  VerifySignupOtpDto as ApiVerifySignupOtpDto,
  ResendSignupOtpDto as ApiResendSignupOtpDto,
  VerifyOtpDto as ApiVerifyOtpDto,
  CreateExchangeCodeDto as ApiCreateExchangeCodeDto,
  ResetPasswordDto as ApiResetPasswordDto,
  AuthMultifactorRequest as ApiAuthMultifactorRequest,
  AuthEnterRequest as ApiAuthEnterRequest,
  AuthForgotInitRequest as ApiAuthForgotInitRequest,
  AuthForgotChallengeRequest as ApiAuthForgotChallengeRequest,
  AuthForgotVerifyRequest as ApiAuthForgotVerifyRequest,
  AuthSessionRequest as ApiAuthSessionRequest,
  ResetReason,
} from '@csisp-api/bff-idp-server';
import { MFAType } from '@csisp-api/bff-idp-server';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';

// Register DTO
export class RegisterDto implements ApiRegisterDto {
  @IsEmail()
  @Length(5, 256)
  email!: string;

  @IsString()
  @Length(1, 512)
  password!: string;

  // 10–12 位数字学号
  @Matches(/^\d{10,12}$/)
  student_id!: string;

  @IsOptional()
  @IsString()
  @Length(1, 128)
  display_name?: string;

  @IsOptional()
  @IsString()
  @Length(1, 512)
  redirect_uri?: string;
}

// LoginInternal DTO
export class LoginInternalDto implements ApiLoginInternalDto {
  @IsEmail()
  @Length(5, 256)
  email!: string;

  @IsString()
  @Length(1, 512)
  password!: string;
}

// VerifySignupOtp DTO
export class VerifySignupOtpDto implements ApiVerifySignupOtpDto {
  @IsEmail()
  email!: string;

  @IsString()
  @Length(1, 128)
  token!: string;
}

// ResendSignupOtp DTO
export class ResendSignupOtpDto implements ApiResendSignupOtpDto {
  @IsEmail()
  email!: string;
}

// VerifyOtp DTO
export class VerifyOtpDto implements ApiVerifyOtpDto {
  @IsString()
  @Length(1, 512)
  token!: string;
}

// CreateExchangeCode DTO
export class CreateExchangeCodeDto implements ApiCreateExchangeCodeDto {
  @IsString()
  @Length(1, 128)
  app_id!: string;

  @IsString()
  @Length(1, 512)
  redirect_uri!: string;

  @IsOptional()
  @IsString()
  @Length(1, 512)
  state?: string;
}

// ResetPassword DTO
export class ResetPasswordDto implements ApiResetPasswordDto {
  @IsString()
  @Length(1, 128)
  studentId!: string;

  @IsString()
  @Length(6, 512)
  newPassword!: string;

  @IsString()
  @Length(1, 512)
  resetToken!: string;

  @IsOptional()
  @IsString()
  reason?: ResetReason;
}

// AuthMultifactor DTO
export class AuthMultifactorRequest implements ApiAuthMultifactorRequest {
  @IsEnum(MFAType)
  type!: MFAType;

  @IsString()
  @Length(1, 512)
  codeOrAssertion!: string;
}

// AuthEnter DTO
export class AuthEnterRequest implements ApiAuthEnterRequest {
  @IsString()
  @Length(1, 128)
  ticket!: string;

  @IsOptional()
  @IsString()
  @Length(1, 512)
  state?: string;
}

// AuthForgotInit DTO
export class AuthForgotInitRequest implements ApiAuthForgotInitRequest {
  @IsEmail()
  email!: string;
}

// AuthForgotChallenge DTO
export class AuthForgotChallengeRequest implements ApiAuthForgotChallengeRequest {
  @IsString()
  @Length(1, 128)
  type!: string;

  @IsString()
  @Length(1, 128)
  studentId!: string;
}

// AuthForgotVerify DTO
export class AuthForgotVerifyRequest implements ApiAuthForgotVerifyRequest {
  @IsString()
  @Length(1, 128)
  type!: string;

  @IsString()
  @Length(1, 128)
  studentId!: string;

  @IsString()
  @Length(1, 128)
  code!: string;
}

// AuthSession DTO
export class AuthSessionRequest implements ApiAuthSessionRequest {
  @IsOptional()
  @IsBoolean()
  logout?: boolean;
}
