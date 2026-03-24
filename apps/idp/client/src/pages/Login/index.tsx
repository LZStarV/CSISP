import { Form, Input, Button, Typography, Alert, message } from 'antd';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import {
  oidcCall,
  hasError,
  authCall,
  VerifyOtpResult,
  LoginInternalResult,
  SendOtpResult,
} from '@/api/rpc';
import { AuthLayout } from '@/layouts/AuthLayout';
import { ROUTE_FINISH, ROUTE_PASSWORD_FORGOT } from '@/routes/router';
import type { AuthorizationRequestInfo } from '@/types/enum';

export function Login() {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [authInfo, setAuthInfo] = useState<AuthorizationRequestInfo | null>(
    null
  );
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const ticket = searchParams.get('ticket');
  const state = searchParams.get('state');
  const tokenHash = searchParams.get('token_hash');
  const otpType = searchParams.get('type');

  useEffect(() => {
    if (ticket) {
      oidcCall<AuthorizationRequestInfo>('getAuthorizationRequest', { ticket })
        .then(res => {
          if (!hasError(res)) {
            setAuthInfo(res.result);
          } else {
            setErrorMsg(res.error.message || '获取授权信息失败');
          }
        })
        .catch(() => {
          setErrorMsg('连接认证服务器失败，请稍后重试');
        });
    }
  }, [ticket]);

  useEffect(() => {
    if (tokenHash && otpType) {
      (async () => {
        try {
          const res = await authCall<VerifyOtpResult>('verify-otp', {
            token_hash: tokenHash,
            type: otpType === 'magic_link' ? 'magic_link' : 'email',
          });
          if (hasError(res)) {
            setErrorMsg(res.error.message || '验证失败或链接已过期');
            return;
          }
          if (res.result?.verified) {
            navigate(ROUTE_FINISH, { replace: true });
          }
        } catch {
          setErrorMsg('验证失败或链接已过期');
        }
      })();
    }
  }, [tokenHash, otpType, navigate]);

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await authCall<LoginInternalResult>('login', {
        email: values.email,
        password: values.password,
      });
      if (hasError(res)) throw new Error(res.error.message || '登录失败');
      const stepUp = (res.result?.stepUp ?? '') as 'PENDING_PASSWORD' | string;

      // 登录成功后，如果存在授权请求，需要透传 ticket 或 state 供后续 enter 阶段使用
      const flowState = {
        ...res.result,
        ticket,
        state: authInfo?.state || state,
      };

      if (stepUp === 'PENDING_PASSWORD') {
        const sent = await authCall<SendOtpResult>('send-otp', {});
        if (hasError(sent)) {
          throw new Error(sent.error.message || '发送验证邮件失败');
        }
        message.success('验证邮件已发送，请前往邮箱查收并完成验证');
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
