import type { AuthorizationRequestInfo, LoginResult } from '@csisp/idl/idp';
import { AuthNextStep } from '@csisp/idl/idp';
import { Form, Input, Button, Typography, Alert } from 'antd';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { authCall, oidcCall, hasError } from '@/api/rpc';
import { AuthLayout } from '@/layouts/AuthLayout';
import {
  ROUTE_MFA_SELECT,
  ROUTE_FINISH,
  ROUTE_PASSWORD_FORGOT,
} from '@/routes/router';

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
        .catch(err => {
          console.error('Fetch auth info failed:', err);
          setErrorMsg('连接认证服务器失败，请稍后重试');
        });
    }
  }, [ticket]);

  const onFinish = async (values: { studentId: string; password: string }) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await authCall<LoginResult>('login', values);
      if (hasError(res)) throw new Error(res.error.message || '登录失败');
      const next = (res.result?.next ?? []) as AuthNextStep[];

      // 登录成功后，如果存在授权请求，需要透传 ticket 或 state 供后续 enter 阶段使用
      const flowState = {
        ...res.result,
        ticket,
        state: authInfo?.state || state,
      };

      if (next.includes(AuthNextStep.Multifactor)) {
        navigate(ROUTE_MFA_SELECT, { state: flowState });
        return;
      }
      if (next.includes(AuthNextStep.Enter)) {
        navigate(ROUTE_FINISH, {
          state: { ...flowState, fromNormalFlow: true },
        });
        return;
      }
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
          该应用申请访问您的基本信息
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
          label='学号'
          name='studentId'
          rules={[
            { required: true, message: '学号不能为空' },
            { min: 1, max: 128, message: '学号长度为1-128个字符' },
          ]}
        >
          <Input placeholder='请输入学号' autoComplete='username' />
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
