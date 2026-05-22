import { Form, Input, Button, Typography, Alert, message } from 'antd';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { idpClientAuthApi } from '@/api/idp-client/auth';
import { AuthLayout } from '@/layouts/AuthLayout';
import { getSupabaseClient } from '@/lib/supabase';
import { ROUTE_FINISH } from '@/routes/router';
import { useAuthStore } from '@/stores/auth';

/**
 * 验证 redirect URL 是否有效且安全
 */
function isValidRedirectUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }
  return url.startsWith('/') && !url.startsWith('//');
}

export function Login() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  // 邮箱 OTP 登录模式的状态
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [emailValue, setEmailValue] = useState('');

  const { loginMode, setLoginMode, setTicket, setStateParam, clearFlowState } =
    useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const ticket = searchParams.get('ticket');
  const state = searchParams.get('state');
  const redirect = searchParams.get('redirect');

  useEffect(() => {
    if (ticket) setTicket(ticket);
    if (state) setStateParam(state);
  }, [ticket, state, setTicket, setStateParam]);

  useEffect(() => {
    async function checkExistingSession() {
      try {
        const supabase = getSupabaseClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          if (redirect) {
            try {
              const decodedRedirect = decodeURIComponent(redirect);
              if (isValidRedirectUrl(decodedRedirect)) {
                navigate(decodedRedirect, { replace: true });
                return;
              }
            } catch {
              /* ignore */
            }
          }
          navigate(ROUTE_FINISH, { replace: true });
        }
      } catch {
        /* ignore */
      }
    }
    checkExistingSession();
  }, []);

  const handleNavigateAfterLogin = () => {
    clearFlowState();
    if (redirect) {
      try {
        const decodedRedirect = decodeURIComponent(redirect);
        if (isValidRedirectUrl(decodedRedirect)) {
          navigate(decodedRedirect, { replace: true });
          return;
        }
      } catch {
        /* ignore */
      }
    }
    navigate(ROUTE_FINISH, { replace: true });
  };

  // ========== 密码登录 ==========

  const onPasswordFinish = async (values: {
    student_id: string;
    password: string;
  }) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await idpClientAuthApi.login({
        student_id: values.student_id,
        password: values.password,
      });

      if (res?.supabaseSession) {
        const supabase = getSupabaseClient();
        await supabase.auth.setSession({
          access_token: res.supabaseSession.access_token,
          refresh_token: res.supabaseSession.refresh_token,
        });
      }

      handleNavigateAfterLogin();
    } catch (e) {
      setErrorMsg(
        e instanceof Error ? e.message : t('login.failed', '登录失败，请重试')
      );
    } finally {
      setLoading(false);
    }
  };

  // ========== 邮箱 OTP 登录 ==========

  const handleSendOtp = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      const res = await idpClientAuthApi.sendOtp({ email: emailValue });
      if (res?.ok && res.tempToken) {
        sessionStorage.setItem('tempToken', res.tempToken);
        setOtpSent(true);
        message.success(t('login.email.otpSent', '验证码已发送，请查收邮箱'));
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
      }
    } catch (e) {
      setErrorMsg(
        e instanceof Error
          ? e.message
          : t('login.email.sendFailed', '发送验证码失败，请稍后重试')
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0) return;
    try {
      await idpClientAuthApi.sendOtp({ email: emailValue });
      message.success(t('login.email.resent', '验证码已重新发送，请查收邮箱'));
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
          : t('login.email.resendFailed', '重发验证码失败，请稍后重试')
      );
    }
  };

  const handleEmailLogin = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const tempToken = sessionStorage.getItem('tempToken');
      if (!tempToken) {
        throw new Error(
          t('login.email.noTempToken', '临时凭证不存在，请先获取验证码')
        );
      }
      const res = await idpClientAuthApi.verifyOtp({
        token: otpCode,
        tempToken,
      });

      if (res?.supabaseSession) {
        const supabase = getSupabaseClient();
        await supabase.auth.setSession({
          access_token: res.supabaseSession.access_token,
          refresh_token: res.supabaseSession.refresh_token,
        });
      }

      sessionStorage.removeItem('tempToken');
      handleNavigateAfterLogin();
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

  const switchMode = () => {
    setErrorMsg(null);
    setOtpSent(false);
    setOtpCode('');
    setEmailValue('');
    setCountdown(0);
    setLoginMode(loginMode === 'password' ? 'email' : 'password');
  };

  const isPasswordMode = loginMode === 'password';

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

      {/* ===== 密码登录模式 ===== */}
      {isPasswordMode && (
        <Form layout='vertical' onFinish={onPasswordFinish} disabled={loading}>
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
                message: t(
                  'login.studentId.invalid',
                  '请输入10-14位数字的学号'
                ),
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
        </Form>
      )}

      {/* ===== 邮箱 OTP 登录模式 ===== */}
      {!isPasswordMode && (
        <Form layout='vertical' disabled={loading}>
          <Form.Item label={t('login.email.label', '邮箱')} required>
            <Input
              placeholder={t('login.email.placeholder', '请输入邮箱')}
              value={emailValue}
              onChange={e => setEmailValue(e.target.value)}
              type='email'
              autoComplete='email'
            />
          </Form.Item>

          {!otpSent && (
            <Form.Item>
              <Button
                type='primary'
                onClick={handleSendOtp}
                block
                loading={loading}
                disabled={
                  !emailValue || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)
                }
              >
                {t('login.email.getOtp', '获取验证码')}
              </Button>
            </Form.Item>
          )}

          {otpSent && (
            <>
              <Form.Item label={t('login.otp.label', '验证码')} required>
                <Input
                  placeholder={t('login.otp.placeholder', '请输入验证码')}
                  value={otpCode}
                  onChange={e => setOtpCode(e.target.value)}
                  maxLength={8}
                  inputMode='numeric'
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type='primary'
                  onClick={handleEmailLogin}
                  block
                  loading={loading}
                  disabled={!/^\d{6,8}$/.test(otpCode)}
                >
                  {t('login.submit', '登录')}
                </Button>
              </Form.Item>

              <Form.Item style={{ textAlign: 'center' }}>
                <Button
                  type='link'
                  onClick={handleResendOtp}
                  disabled={countdown > 0}
                >
                  {countdown > 0
                    ? t('login.email.resendCountdown', '{seconds}秒后重发', {
                        seconds: countdown,
                      })
                    : t('login.email.resend', '没有收到验证码？重发')}
                </Button>
              </Form.Item>
            </>
          )}
        </Form>
      )}

      {/* ===== 模式切换链接 ===== */}
      <div style={{ textAlign: 'right', marginTop: 8 }}>
        <Button type='link' onClick={switchMode}>
          {isPasswordMode
            ? t('login.mode.switchToEmail', '邮箱登录')
            : t('login.mode.switchToPassword', '密码登录')}
        </Button>
      </div>
    </AuthLayout>
  );
}
