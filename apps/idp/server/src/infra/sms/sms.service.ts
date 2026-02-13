import Credential from '@alicloud/credentials';
import Dypnsapi20170525, * as $Dypnsapi20170525 from '@alicloud/dypnsapi20170525';
import * as $OpenApi from '@alicloud/openapi-client';
import * as $Util from '@alicloud/tea-util';
import { loadRootEnv } from '@csisp/utils';
import { getIdpLogger } from '@infra/logger';
import { set as redisSet, get as redisGet } from '@infra/redis';
import { Injectable } from '@nestjs/common';

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
    this.logger.info({ n }, 'generated otp code');
    return String(n);
  }

  // 发送 OTP 短信验证码
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

  // 校验 OTP 短信验证码
  async verifyOtp(phone: string, code: string): Promise<boolean> {
    if (!phone || !code) return false;
    const expected = await redisGet(`idp:otp:${phone}`);
    this.logger.info({ phone, expected, code }, 'verify otp');
    return !!expected && expected === code;
  }
}
