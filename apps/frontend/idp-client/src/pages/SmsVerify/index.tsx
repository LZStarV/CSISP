import { Alert, Button, Form, Input, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';

import { idpClientAuthApi } from '@/api/idp-client/auth';
import { AuthLayout } from '@/layouts/AuthLayout';
import {
  ROUTE_LOGIN,
  ROUTE_PASSWORD_RESET,
  ROUTE_FINISH,
} from '@/routes/router';
import { MFAType } from '@/types/enum';

export function SmsVerify() {
  const { t } = useTranslation('common');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | undefined>(undefined);
  const [codeValue, setCodeValue] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [expireAt, setExpireAt] = useState<number>(0);
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const fromForgot = params.get('flow') === 'forgot';
  const studentId = params.get('studentId') || undefined;

  useEffect(() => {
    if (fromForgot && !studentId) {
      navigate(ROUTE_LOGIN);
      return;
    }
    if (fromForgot && studentId) {
      (async () => {
        try {
          const res = await idpClientAuthApi.forgotInit({
            email: studentId,
          } as any);
          const methods = (res?.methods ?? []) as any[];
          const sms = methods.find(m => m?.type === MFAType.Sms);
          setPhone((sms?.extra as string | undefined) ?? undefined);
        } catch {
          // ignore
        }
      })();
    }
  }, [fromForgot, studentId]);

  useEffect(() => {
    if (!phone) return;
    const key = `idp_otp_exp:${phone}`;
    const expStr = localStorage.getItem(key);
    const exp = expStr ? Number(expStr) : 0;
    setExpireAt(exp);
  }, [phone]);

  useEffect(() => {
    if (!expireAt || expireAt <= 0) return;
    const now = Date.now();
    const initialRemain =
      expireAt > now ? Math.ceil((expireAt - now) / 1000) : 0;
    setCooldown(initialRemain);
    const timer = setInterval(() => {
      const now2 = Date.now();
      const remain2 = expireAt > now2 ? Math.ceil((expireAt - now2) / 1000) : 0;
      setCooldown(remain2);
      if (remain2 <= 0) {
        clearInterval(timer);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [expireAt]);

  const sendCode = async () => {
    if (!phone) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      let res: any;
      if (fromForgot && studentId) {
        res = await idpClientAuthApi.forgotChallenge({
          type: 'sms',
          studentId,
        } as any);
      } else {
        res = await idpClientAuthApi.multifactor({
          type: MFAType.Sms,
          codeOrAssertion: 'request',
        });
      }
      const sms = res?.sms;
      if (sms && sms.success === false) {
        throw new Error(sms.message || t('sms.verify.failed', '短信发送失败'));
      }
      const exp = Date.now() + 60000;
      localStorage.setItem(`idp_otp_exp:${phone}`, String(exp));
      setExpireAt(exp);
      setCooldown(60);
    } catch (e) {
      setErrorMsg(
        e instanceof Error
          ? e.message
          : t('forgot.init.failed', '发送失败，请重试')
      );
    } finally {
      setLoading(false);
    }
  };

  const onFinish = async (_values: { code: string }) => {
    if (!phone) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      if (fromForgot && studentId) {
        const res = await idpClientAuthApi.forgotVerify({
          type: 'sms',
          studentId,
          code: codeValue,
        } as any);
        const token = res?.reset_token;
        if (!token) throw new Error(t('verify.failed', '校验失败'));
        if (studentId) {
          sessionStorage.setItem(`idp_reset_token:${studentId}`, token);
        }
        const qs = new URLSearchParams({
          studentId: studentId || '',
        }).toString();
        navigate(`${ROUTE_PASSWORD_RESET}?${qs}`);
      } else {
        await idpClientAuthApi.multifactor({
          type: MFAType.Sms,
          codeOrAssertion: codeValue,
        });

        const flowState = (location.state as any) || {};
        navigate(ROUTE_FINISH, {
          state: {
            ...flowState,
            fromNormalFlow: true,
          },
        });
      }
    } catch (e) {
      setErrorMsg(
        e instanceof Error ? e.message : t('verify.failed', '校验失败，请重试')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title={t('mfa.title', '多重身份验证')}
      subtitle={t('sms.verify.title', '请输入短信验证码')}
    >
      <div style={{ maxWidth: 420, margin: '0 auto' }}>
        <Typography.Title level={3} style={{ textAlign: 'center' }}>
          {t('sms.verify.title', '短信验证码校验')}
        </Typography.Title>
        {errorMsg && (
          <Alert
            type='error'
            message={errorMsg}
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}
        <div
          style={{
            display: 'flex',
            gap: 8,
            marginBottom: 16,
            justifyContent: 'center',
          }}
        >
          <Input value={phone} disabled style={{ maxWidth: 240 }} />
          <Button
            onClick={sendCode}
            loading={loading}
            disabled={loading || cooldown > 0}
          >
            {cooldown > 0
              ? t('signup.otp.resend', '重新发送验证码') + `(${cooldown}s)`
              : t('forgot.init.submit', '发送验证码')}
          </Button>
        </div>
        <Form layout='vertical' onFinish={onFinish} disabled={loading}>
          <Form.Item
            label={t('verify.otp.label', '验证码')}
            name='code'
            rules={[
              {
                required: true,
                message: t('verify.otp.required', '验证码不能为空'),
              },
            ]}
          >
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Input.OTP length={6} value={codeValue} onChange={setCodeValue} />
            </div>
          </Form.Item>
          <Form.Item>
            <Button
              type='primary'
              htmlType='submit'
              block
              loading={loading}
              disabled={codeValue.length !== 6}
            >
              {t('verify.submit', '提交验证')}
            </Button>
          </Form.Item>
        </Form>
      </div>
    </AuthLayout>
  );
}
