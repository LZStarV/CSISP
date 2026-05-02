import type { GetAuthorizationRequestResult } from '@csisp/contracts';
import { Form, Input, Button, Typography, Alert, message } from 'antd';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { commonOidcApi } from '@/api/common/oidc';
import { idpClientAuthApi } from '@/api/idp-client/auth';
import { AuthLayout } from '@/layouts/AuthLayout';
import { ROUTE_FINISH, ROUTE_PASSWORD_FORGOT } from '@/routes/router';
import { useAuthStore } from '@/stores/auth';

export function Login() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const {
    ticket: storedTicket,
    state: storedState,
    authInfo: storedAuthInfo,
    otpSent,
    otpCode,
    setTicket,
    setStateParam,
    setAuthInfo,
    setOtpSent,
    setOtpCode,
    clearFlowState,
  } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const ticket = searchParams.get('ticket');
  const state = searchParams.get('state');

  useEffect(() => {
    // 优先使用 URL 参数，其次使用 store
    if (ticket) {
      setTicket(ticket);
    }
    if (state) {
      setStateParam(state);
    }
  }, [ticket, state, setTicket, setStateParam]);

  useEffect(() => {
    const currentTicket = ticket || storedTicket;
    if (currentTicket && !storedAuthInfo) {
      commonOidcApi
        .getAuthorizationRequest({
          ticket: currentTicket,
        })
        .then((res: GetAuthorizationRequestResult) => {
          setAuthInfo(res);
        })
        .catch(error => {
          setErrorMsg(
            error.message || t('oidc.getAuthInfoFailed', '获取授权信息失败')
          );
        });
    }
  }, [ticket, storedTicket, storedAuthInfo, t, setAuthInfo]);

  const handleVerifyOtp = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await idpClientAuthApi.verifyOtp({
        token: otpCode,
      });
      if (res?.verified) {
        clearFlowState();
        navigate(ROUTE_FINISH, { replace: true });
      }
    } catch (e) {
      setErrorMsg(
        e instanceof Error
          ? e.message
          : t('verify.otp.invalid', '验证失败或验证码已过期')
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0) return;
    setResendLoading(true);
    setErrorMsg(null);
    try {
      await idpClientAuthApi.resendLoginOtp();
      message.success(t('verify.email.resent', '验证码已重新发送，请查收邮箱'));
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (e) {
      setErrorMsg(
        e instanceof Error
          ? e.message
          : t('verify.email.resendFailed', '重发验证码失败，请稍后重试')
      );
    } finally {
      setResendLoading(false);
    }
  };

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await idpClientAuthApi.login({
        email: values.email,
        password: values.password,
      });
      const stepUp = (res?.stepUp ?? '') as 'PENDING_PASSWORD' | string;

      const currentTicket = ticket || storedTicket;
      const currentState = state || storedState;
      const currentAuthInfo = storedAuthInfo;

      const flowState = {
        ...res,
        ticket: currentTicket,
        state: currentAuthInfo?.state || currentState,
      };

      if (stepUp === 'PENDING_PASSWORD') {
        await idpClientAuthApi.sendOtp();
        message.success(
          t('verify.email.sent', '验证邮件已发送，请前往邮箱查收并完成验证')
        );
        setOtpSent(true);
        return;
      }

      clearFlowState();
      navigate(ROUTE_FINISH, {
        state: { ...flowState, fromNormalFlow: true },
      });
      return;
    } catch (e) {
      setErrorMsg(
        e instanceof Error ? e.message : t('login.failed', '登录失败，请重试')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <Typography.Title level={3} style={{ textAlign: 'center' }}>
        {storedAuthInfo
          ? t('login.loginTo', '登录到 {clientName}', {
              clientName: storedAuthInfo.client_name,
            })
          : t('oidc.unifiedLogin', '统一身份认证登录')}
      </Typography.Title>
      {storedAuthInfo && (
        <Typography.Paragraph
          type='secondary'
          style={{ textAlign: 'center', marginTop: -8 }}
        >
          {t('login.subtitle.appRequest', '该应用申请访问您的基本信息')}（
          {t('login.subtitle.verifyByEmail', '本次将通过邮箱验证完成登录')}）
        </Typography.Paragraph>
      )}
      {errorMsg && (
        <Alert
          type='error'
          message={errorMsg}
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}
      {otpSent && (
        <Form layout='vertical' disabled={loading}>
          <Form.Item label={t('verify.otp.label', '邮箱验证码')} required>
            <Input
              placeholder={t(
                'signup.otp.placeholder',
                '请输入邮箱中的 8 位验证码',
                {
                  digitCount: 8,
                }
              )}
              value={otpCode}
              onChange={e => setOtpCode(e.target.value)}
              maxLength={8}
              inputMode='numeric'
            />
          </Form.Item>
          <Form.Item>
            <Button
              type='primary'
              onClick={handleVerifyOtp}
              block
              loading={loading}
              disabled={!/^\d{8}$/.test(otpCode)}
            >
              {t('verify.submit', '完成验证')}
            </Button>
          </Form.Item>
          <Form.Item>
            <Button
              type='link'
              onClick={handleResendOtp}
              loading={resendLoading}
              disabled={countdown > 0 || resendLoading}
              block
            >
              {countdown > 0
                ? t('verify.email.resendCountdown', '{seconds}秒后重发', {
                    seconds: countdown,
                  })
                : t('verify.email.resend', '没有收到验证码？重发')}
            </Button>
          </Form.Item>
        </Form>
      )}
      <Form layout='vertical' onFinish={onFinish} disabled={loading}>
        <Form.Item
          label={t('login.email.label', '邮箱')}
          name='email'
          rules={[
            {
              required: true,
              message: t('login.email.required', '邮箱不能为空'),
            },
            {
              type: 'email',
              message: t('login.email.invalid', '请输入有效的邮箱地址'),
            },
            {
              min: 3,
              max: 128,
              message: t('login.email.length', '邮箱长度为3-128个字符', {
                minLength: 3,
                maxLength: 128,
              }),
            },
          ]}
        >
          <Input
            placeholder={t('login.email.placeholder', '请输入邮箱')}
            autoComplete='username'
          />
        </Form.Item>

        <Form.Item
          label={t('login.password.label', '密码')}
          name='password'
          rules={[
            {
              required: true,
              message: t('login.password.required', '密码不能为空'),
            },
          ]}
        >
          <Input.Password
            placeholder={t('login.password.placeholder', '请输入密码')}
            autoComplete='current-password'
          />
        </Form.Item>

        <Form.Item>
          <Button type='primary' htmlType='submit' block loading={loading}>
            {t('login.submit', '登录')}
          </Button>
        </Form.Item>

        <div style={{ textAlign: 'center', marginTop: 8 }}>
          <Button type='link' onClick={() => navigate(ROUTE_PASSWORD_FORGOT)}>
            {t('login.forgotPassword', '忘记密码？')}
          </Button>
        </div>
      </Form>
    </AuthLayout>
  );
}
