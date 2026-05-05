import { Form, Input, Button, Typography, Alert, message } from 'antd';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { idpClientAuthApi } from '@/api/idp-client/auth';
import { AuthLayout } from '@/layouts/AuthLayout';
import { getSupabaseClient } from '@/lib/supabase';
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
    otpSent,
    otpCode,
    supabaseSession,
    setTicket,
    setStateParam,
    setOtpSent,
    setOtpCode,
    setSupabaseSession,
    clearFlowState,
  } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const ticket = searchParams.get('ticket');
  const state = searchParams.get('state');
  const redirect = searchParams.get('redirect');

  useEffect(() => {
    // 优先使用 URL 参数，其次使用 store
    if (ticket) {
      setTicket(ticket);
    }
    if (state) {
      setStateParam(state);
    }
  }, [ticket, state, setTicket, setStateParam]);

  const handleVerifyOtp = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await idpClientAuthApi.verifyOtp({
        token: otpCode,
      });
      if (res?.verified) {
        // 如果有存储的 supabaseSession，设置到 Supabase Auth 中
        if (supabaseSession) {
          const supabase = getSupabaseClient();
          await supabase.auth.setSession({
            access_token: supabaseSession.access_token,
            refresh_token: supabaseSession.refresh_token,
          });
        }
        clearFlowState();
        // 如果有 redirect 参数，跳转到 redirect 地址
        if (redirect) {
          const decodedRedirect = decodeURIComponent(redirect);
          navigate(decodedRedirect, { replace: true });
        } else {
          navigate(ROUTE_FINISH, { replace: true });
        }
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

  const onFinish = async (values: { student_id: string; password: string }) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await idpClientAuthApi.login({
        student_id: values.student_id,
        password: values.password,
      });
      const stepUp = (res?.stepUp ?? '') as 'PENDING_PASSWORD' | string;

      // 如果有 supabaseSession，保存到 store 中
      if ((res as any)?.supabaseSession) {
        setSupabaseSession((res as any).supabaseSession);
      }

      const currentTicket = ticket || storedTicket;
      const currentState = state || storedState;

      const flowState = {
        ...res,
        ticket: currentTicket,
        state: currentState,
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
      // 如果有 redirect 参数，跳转到 redirect 地址
      if (redirect) {
        const decodedRedirect = decodeURIComponent(redirect);
        navigate(decodedRedirect, { replace: true });
      } else {
        navigate(ROUTE_FINISH, {
          state: { ...flowState, fromNormalFlow: true },
        });
      }
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
        {t('oidc.unifiedLogin', '统一身份认证登录')}
      </Typography.Title>
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
          label={t('login.studentId.label', '学号')}
          name='student_id'
          rules={[
            {
              required: true,
              message: t('login.studentId.required', '学号不能为空'),
            },
            {
              pattern: /^\d{10,14}$/,
              message: t('login.studentId.invalid', '请输入10-14位数字的学号'),
            },
          ]}
        >
          <Input
            placeholder={t('login.studentId.placeholder', '请输入学号')}
            autoComplete='username'
            maxLength={14}
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
