import { Form, Input, Button, Typography, Alert } from 'antd';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { call } from '@/api/rpc';
import { AuthLayout } from '@/layouts/AuthLayout';

export function Login() {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const navigate = useNavigate();

  const onFinish = async (values: { studentId: string; password: string }) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await call('auth/login', values);
      if (res.error) throw new Error(res.error.message || '登录失败');
      const next: string[] = res.result?.next ?? [];
      if (next.includes('multifactor')) {
        navigate('/mfa/select', { state: res.result });
        return;
      }
      if (next.includes('enter')) {
        navigate('/finish', { state: { fromNormalFlow: true } });
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
        统一身份认证登录
      </Typography.Title>
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
          <a href='#'>忘记密码？</a>
        </div>
      </Form>
    </AuthLayout>
  );
}
