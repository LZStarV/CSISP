import {
  CommonApiException,
  CommonErrorCode,
} from '@common/errors/common-error-codes';
import { SupabaseUserRepository } from '@csisp/dal';
import {
  AuthForgotInitResult,
  AuthForgotVerifyResult,
  MFAType,
  NextResult,
  RecoveryMethod,
  RecoveryUnavailableReason,
} from '@csisp-api/idp-server';
import { HttpStatus } from '@nestjs/common';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ForgotPasswordService {
  constructor(private readonly userRepository: SupabaseUserRepository) {}

  async forgotInit(params: { email: string }): Promise<AuthForgotInitResult> {
    const email = String(params.email ?? '').trim();
    const recoveryInfo = await this.userRepository.findRecoveryInfo(email);
    if (!recoveryInfo) {
      return {
        student_id: '',
        methods: [],
      };
    }
    const methods: RecoveryMethod[] = [];
    {
      const enabled = false;
      const reason = RecoveryUnavailableReason.NUMBER_3;
      methods.push({
        type: MFAType.NUMBER_0,
        enabled,
        reason,
      });
    }
    {
      const enabled = false;
      const reason = RecoveryUnavailableReason.NUMBER_3;
      methods.push({
        type: MFAType.NUMBER_1,
        enabled,
        reason,
      });
    }
    methods.push({
      type: MFAType.NUMBER_2,
      enabled: false,
      reason: RecoveryUnavailableReason.NUMBER_3,
    });
    methods.push({
      type: MFAType.NUMBER_3,
      enabled: false,
      reason: RecoveryUnavailableReason.NUMBER_3,
    });
    return {
      student_id: recoveryInfo.student_id,
      methods,
    };
  }

  async forgotChallenge(_params: {
    type: string;
    studentId: string;
  }): Promise<NextResult> {
    throw new CommonApiException(
      CommonErrorCode.InternalError,
      'Recovery via SMS not implemented',
      HttpStatus.NOT_IMPLEMENTED
    );
  }

  async forgotVerify(_params: {
    type: string;
    studentId: string;
    code: string;
  }): Promise<AuthForgotVerifyResult> {
    throw new CommonApiException(
      CommonErrorCode.InternalError,
      'Recovery via SMS not implemented',
      HttpStatus.NOT_IMPLEMENTED
    );
  }
}
