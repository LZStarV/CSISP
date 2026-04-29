import type {
  RegisterParams,
  ResendSignupOtpParams,
  VerifySignupOtpParams,
} from '@csisp/contracts';
import { Form, Input, Button, Typography, Alert, message, Space } from 'antd';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { idpClientAuthApi } from '@/api/idp-client/auth';
import { AuthLayout } from '@/layouts/AuthLayout';
import { ROUTE_LOGIN } from '@/routes/router';

export function Signup() {
  const { t } = useTranslation('common');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const navigate = useNavigate();
  const [otpStage, setOtpStage] = useState(false);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    let timer: any;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [resendCooldown]);

  const onFinish = async (values: {
    email: string;
    password: string;
    student_id: string;
    display_name?: string;
  }) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const params: RegisterParams = {
        email: values.email,
        password: values.password,
        student_id: values.student_id,
        display_name: values.display_name,
      };
      await idpClientAuthApi.register(params);
      setEmail(values.email);
      setOtpStage(true);
      message.success(
        t(
          'signup.email.sent',
          '验证码已发送至邮箱，请输入 8 位验证码完成注册',
          {
            digitCount: 8,
          }
        )
      );
    } catch (e) {
      setErrorMsg(
        e instanceof Error ? e.message : t('signup.failed', '注册失败，请重试')
      );
    } finally {
      setLoading(false);
    }
  };

  const onVerifyOtp = async () => {
    if (!email || !otp) {
      setErrorMsg(t('verify.otp.required', '请输入验证码'));
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      const params: VerifySignupOtpParams = { email, token: otp };
      const res = await idpClientAuthApi.verifySignupOtp(params);
      if (!res?.verified) {
        throw new Error(t('verify.otp.invalid', '验证码无效或已过期'));
      }
      message.success(
        t('signup.confirmed', '注册已确认，请使用邮箱和密码登录')
      );
      navigate(ROUTE_LOGIN, { replace: true });
    } catch (e) {
      setErrorMsg(
        e instanceof Error ? e.message : t('verify.failed', '验证失败，请重试')
      );
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    if (!email) {
      setErrorMsg(t('signup.completeFirst', '请先完成注册表单'));
      return;
    }
    if (resendCooldown > 0) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const params: ResendSignupOtpParams = { email };
      const res = await idpClientAuthApi.resendSignupOtp(params);
      if (!res?.ok) {
        throw new Error(t('forgot.init.failed', '发送失败，请稍后重试'));
      }
      message.success(t('signup.otp.resent', '验证码已重新发送，请查收邮箱'));
      setResendCooldown(60);
    } catch (e) {
      setErrorMsg(
        e instanceof Error
          ? e.message
          : t('forgot.init.failed', '发送失败，请稍后重试')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <Typography.Title level={3} style={{ textAlign: 'center' }}>
        {t('signup.title', '新用户注册')}
      </Typography.Title>
      {errorMsg && (
        <Alert
          type='error'
          message={errorMsg}
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}
      {!otpStage ? (
        <Form layout='vertical' onFinish={onFinish} disabled={loading}>
          <Form.Item
            label={t('validation.studentId.label', '学号')}
            name='student_id'
            rules={[
              {
                required: true,
                message: t('validation.studentId.label', '学号') + '不能为空',
              },
              {
                pattern: /^\d{10,12}$/,
                message: t(
                  'validation.studentId.pattern',
                  '学号为10到12位数字',
                  {
                    minDigits: 10,
                    maxDigits: 12,
                  }
                ),
              },
            ]}
          >
            <Input
              placeholder={t('validation.studentId.placeholder', '请输入学号')}
            />
          </Form.Item>

          <Form.Item
            label={t('signup.email.label', '邮箱')}
            name='email'
            rules={[
              {
                required: true,
                message: t('signup.email.required', '邮箱不能为空'),
              },
              {
                type: 'email',
                message: t('signup.email.invalid', '请输入有效的邮箱地址'),
              },
              {
                min: 3,
                max: 128,
                message: t('signup.email.length', '邮箱长度为3-128个字符', {
                  minLength: 3,
                  maxLength: 128,
                }),
              },
            ]}
          >
            <Input
              placeholder={t('signup.email.placeholder', '请输入邮箱')}
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
              autoComplete='new-password'
            />
          </Form.Item>

          <Form.Item
            label={t('validation.displayName.label', '显示名称（可选）')}
            name='display_name'
            rules={[
              {
                min: 1,
                max: 128,
                message: t(
                  'validation.displayName.length',
                  '长度为1-128个字符',
                  {
                    minLength: 1,
                    maxLength: 128,
                  }
                ),
              },
            ]}
          >
            <Input
              placeholder={t(
                'validation.displayName.placeholder',
                '用于在系统中显示的昵称'
              )}
            />
          </Form.Item>

          <Form.Item>
            <Button type='primary' htmlType='submit' block loading={loading}>
              {t('signup.submit', '注册')}
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center', marginTop: 8 }}>
            <Button type='link' onClick={() => navigate(ROUTE_LOGIN)}>
              {t('forgot.init.backToLogin', '返回登录')}
            </Button>
          </div>
        </Form>
      ) : (
        <>
          <Alert
            type='info'
            message={t(
              'signup.email.sent',
              '验证码已发送至邮箱，请输入 8 位验证码完成注册',
              { email }
            )}
            showIcon
            style={{ marginBottom: 16 }}
          />
          <Space direction='vertical' style={{ width: '100%' }}>
            <Input
              value={otp}
              onChange={e => setOtp(e.target.value)}
              placeholder={t(
                'signup.otp.placeholder',
                '请输入邮箱中的6位验证码',
                {
                  digitCount: 6,
                }
              )}
              maxLength={8}
              inputMode='numeric'
            />
            <Button
              type='primary'
              onClick={onVerifyOtp}
              loading={loading}
              disabled={!/^\d{8}$/.test(otp)}
              block
            >
              {t('signup.confirm', '确认注册')}
            </Button>
            <Button
              type='link'
              onClick={onResend}
              disabled={resendCooldown > 0}
            >
              {resendCooldown > 0
                ? t('signup.otp.resend', '重新发送验证码') +
                  `（${resendCooldown}s）`
                : t('signup.otp.resend', '重新发送验证码')}
            </Button>
            <Button type='link' onClick={() => navigate(ROUTE_LOGIN)}>
              {t('forgot.init.backToLogin', '返回登录')}
            </Button>
          </Space>
        </>
      )}
    </AuthLayout>
  );
}
