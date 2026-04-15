import { Form, Input, Button, Typography, Alert, message } from 'antd';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import {
  oidcCall,
  authCall,
  GetAuthorizationRequestResult,
  LoginResult,
  VerifyOtpResult,
  SendOtpResult,
} from '@/api';
import { AuthLayout } from '@/layouts/AuthLayout';
import { ROUTE_FINISH, ROUTE_PASSWORD_FORGOT } from '@/routes/router';

export function Login() {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [authInfo, setAuthInfo] =
    useState<GetAuthorizationRequestResult | null>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const ticket = searchParams.get('ticket');
  const state = searchParams.get('state');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');

  useEffect(() => {
    if (ticket) {
      oidcCall<GetAuthorizationRequestResult>('getAuthorizationRequest', {
        ticket,
      })
        .then((res: GetAuthorizationRequestResult) => {
          setAuthInfo(res);
        })
        .catch(error => {
          setErrorMsg(error.message || '获取授权信息失败');
        });
    }
  }, [ticket]);

  const handleVerifyOtp = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await authCall<VerifyOtpResult>('verify-otp', {
        token: otpCode,
      });
      if (res?.verified) {
        navigate(ROUTE_FINISH, { replace: true });
      }
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : '验证失败或验证码已过期');
    } finally {
      setLoading(false);
    }
  };

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await authCall<LoginResult>('login', {
        email: values.email,
        password: values.password,
      });
      const stepUp = (res?.stepUp ?? '') as 'PENDING_PASSWORD' | string;

      // 登录成功后，如果存在授权请求，需要透传 ticket 或 state 供后续 enter 阶段使用
      const flowState = {
        ...res,
        ticket,
        state: authInfo?.state || state,
      };

      if (stepUp === 'PENDING_PASSWORD') {
        await authCall<SendOtpResult>('send-otp', {});
        message.success('验证邮件已发送，请前往邮箱查收并完成验证');
        setOtpSent(true);
        return;
      }

      navigate(ROUTE_FINISH, {
        state: { ...flowState, fromNormalFlow: true },
      });
      return;
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : '登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <Typography.Title level={3} style={{ textAlign: 'center' }}>
        {authInfo ? `登录到 ${authInfo.client_name}` : '统一身份认证登录'}
      </Typography.Title>
      {authInfo && (
        <Typography.Paragraph
          type='secondary'
          style={{ textAlign: 'center', marginTop: -8 }}
        >
          该应用申请访问您的基本信息（本次将通过邮箱验证完成登录）
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
          <Form.Item label='邮箱验证码' required>
            <Input
              placeholder='请输入邮箱中的6位验证码'
              value={otpCode}
              onChange={e => setOtpCode(e.target.value)}
              maxLength={6}
              inputMode='numeric'
            />
          </Form.Item>
          <Form.Item>
            <Button
              type='primary'
              onClick={handleVerifyOtp}
              block
              loading={loading}
              disabled={!/^\d{6}$/.test(otpCode)}
            >
              完成验证
            </Button>
          </Form.Item>
        </Form>
      )}
      <Form layout='vertical' onFinish={onFinish} disabled={loading}>
        <Form.Item
          label='邮箱'
          name='email'
          rules={[
            { required: true, message: '邮箱不能为空' },
            { type: 'email', message: '请输入有效的邮箱地址' },
            { min: 3, max: 128, message: '邮箱长度为3-128个字符' },
          ]}
        >
          <Input placeholder='请输入邮箱' autoComplete='username' />
        </Form.Item>

        <Form.Item
          label='密码'
          name='password'
          rules={[
            { required: true, message: '密码不能为空' },
            { min: 1, max: 512, message: '密码长度为1-512个字符' },
          ]}
        >
          <Input.Password
            placeholder='请输入密码'
            autoComplete='current-password'
          />
        </Form.Item>

        <Form.Item>
          <Button type='primary' htmlType='submit' block loading={loading}>
            登录
          </Button>
        </Form.Item>

        <div style={{ textAlign: 'center', marginTop: 8 }}>
          <Button type='link' onClick={() => navigate(ROUTE_PASSWORD_FORGOT)}>
            忘记密码？
          </Button>
        </div>
      </Form>
    </AuthLayout>
  );
}
