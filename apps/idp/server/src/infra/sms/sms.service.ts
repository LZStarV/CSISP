import Credential from '@alicloud/credentials';
import Dypnsapi20170525, * as $Dypnsapi20170525 from '@alicloud/dypnsapi20170525';
import * as $OpenApi from '@alicloud/openapi-client';
import * as $Util from '@alicloud/tea-util';
import { loadRootEnv } from '@csisp/utils';
import { Injectable } from '@nestjs/common';

import { getIdpLogger } from '../logger';
import { set as redisSet } from '../redis';

const OTP_MINUTES = 5;

type SmsSendResult = {
  Code: string;
  Success: boolean;
  Message?: string;
  RequestId?: string;
  AccessDeniedDetail?: string;
  Model?: Record<string, any>;
};

@Injectable()
export class SmsService {
  private logger = getIdpLogger('sms-service');

  constructor() {
    loadRootEnv();
  }

  private createClient(): Dypnsapi20170525 {
    const credential = new Credential();
    const config = new $OpenApi.Config({ credential });
    config.endpoint = 'dypnsapi.aliyuncs.com';
    return new Dypnsapi20170525(config);
  }

  private generateCode(): string {
    const n = Math.floor(100000 + Math.random() * 900000);
    return String(n);
  }

  async sendOtp(phone: string): Promise<SmsSendResult> {
    const code = this.generateCode();
    await redisSet(`idp:otp:${phone}`, code, OTP_MINUTES * 60);
    const client = this.createClient();
    const signName = process.env.SMS_SIGN_NAME || '速通互联验证码';
    const templateCode = process.env.SMS_TEMPLATE_CODE || '100001';
    const schemeName = process.env.SMS_SCHEME_NAME || 'CSISP';
    const params = JSON.stringify({ code, min: String(OTP_MINUTES) });
    const req = new $Dypnsapi20170525.SendSmsVerifyCodeRequest({
      signName,
      phoneNumber: phone,
      schemeName,
      templateCode,
      templateParam: params,
    });
    const runtime = new $Util.RuntimeOptions({});
    try {
      const resp: any = await client.sendSmsVerifyCodeWithOptions(req, runtime);
      const body = (resp as any)?.body ?? {};
      const apiResult: SmsSendResult = {
        AccessDeniedDetail: body.AccessDeniedDetail ?? '',
        Message: body.Message ?? '',
        RequestId: body.RequestId ?? '',
        Model: body.Model ?? {},
        Code: body.Code ?? '',
        Success: body.Success === true,
      };
      this.logger.info(
        { phone, status: resp?.statusCode, code: apiResult.Code },
        'sms sent'
      );
      return apiResult;
    } catch (error: any) {
      this.logger.error(
        { phone, message: error?.message, recommend: error?.data?.Recommend },
        'sms send failed'
      );
      const apiResult: SmsSendResult = {
        AccessDeniedDetail: error?.data?.AccessDeniedDetail ?? '',
        Message: error?.message ?? 'sms send failed',
        RequestId: error?.data?.RequestId ?? '',
        Model: {},
        Code: 'ERROR',
        Success: false,
      };
      return apiResult;
    }
  }
}
