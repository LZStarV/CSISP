import type {
  RegisterParams,
  ResendSignupOtpParams,
  VerifySignupOtpParams,
} from '@csisp/contracts';
import { Form, Input, Button, Typography, Alert, message, Space } from 'antd';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { idpClientAuthApi } from '@/api/idp-client/auth';
import { AuthLayout } from '@/layouts/AuthLayout';
import { ROUTE_LOGIN } from '@/routes/router';

export function Signup() {
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
      message.success('验证码已发送至邮箱，请输入 8 位验证码完成注册');
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : '注册失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const onVerifyOtp = async () => {
    if (!email || !otp) {
      setErrorMsg('请输入验证码');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      const params: VerifySignupOtpParams = { email, token: otp };
      const res = await idpClientAuthApi.verifySignupOtp(params);
      if (!res?.verified) {
        throw new Error('验证码无效或已过期');
      }
      message.success('注册已确认，请使用邮箱和密码登录');
      navigate(ROUTE_LOGIN, { replace: true });
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : '验证失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    if (!email) {
      setErrorMsg('请先完成注册表单');
      return;
    }
    if (resendCooldown > 0) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const params: ResendSignupOtpParams = { email };
      const res = await idpClientAuthApi.resendSignupOtp(params);
      if (!res?.ok) {
        throw new Error('发送失败，请稍后重试');
      }
      message.success('验证码已重新发送，请查收邮箱');
      setResendCooldown(60);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : '发送失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <Typography.Title level={3} style={{ textAlign: 'center' }}>
        新用户注册
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
            label='学号'
            name='student_id'
            rules={[
              { required: true, message: '学号不能为空' },
              {
                pattern: /^\d{10,12}$/,
                message: '学号为10到12位数字',
              },
            ]}
          >
            <Input placeholder='请输入10-12位数字学号' />
          </Form.Item>

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
              autoComplete='new-password'
            />
          </Form.Item>

          <Form.Item
            label='显示名称（可选）'
            name='display_name'
            rules={[{ min: 1, max: 128, message: '长度为1-128个字符' }]}
          >
            <Input placeholder='用于在系统中显示的昵称' />
          </Form.Item>

          <Form.Item>
            <Button type='primary' htmlType='submit' block loading={loading}>
              注册并发送验证码
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center', marginTop: 8 }}>
            <Button type='link' onClick={() => navigate(ROUTE_LOGIN)}>
              返回登录
            </Button>
          </div>
        </Form>
      ) : (
        <>
          <Alert
            type='info'
            message={`验证码已发送至 ${email}，请输入 8 位验证码完成注册`}
            showIcon
            style={{ marginBottom: 16 }}
          />
          <Space direction='vertical' style={{ width: '100%' }}>
            <Input
              value={otp}
              onChange={e => setOtp(e.target.value)}
              placeholder='请输入验证码'
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
              确认注册
            </Button>
            <Button
              type='link'
              onClick={onResend}
              disabled={resendCooldown > 0}
            >
              {resendCooldown > 0
                ? `重新发送（${resendCooldown}s）`
                : '重新发送验证码'}
            </Button>
            <Button type='link' onClick={() => navigate(ROUTE_LOGIN)}>
              返回登录
            </Button>
          </Space>
        </>
      )}
    </AuthLayout>
  );
}
