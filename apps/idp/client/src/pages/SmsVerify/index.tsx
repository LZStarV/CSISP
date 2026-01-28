import { Alert, Button, Form, Input, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { call } from '@/api/rpc';
import { AuthLayout } from '@/layouts/AuthLayout';

export function SmsVerify() {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | undefined>(undefined);
  const [codeValue, setCodeValue] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const state = location.state as { phone?: string } | null;
    setPhone(state?.phone);
  }, [location.state]);

  useEffect(() => {
    if (!phone) return;
    const key = `idp_otp_exp:${phone}`;
    const expStr = localStorage.getItem(key);
    const exp = expStr ? Number(expStr) : 0;
    const now = Date.now();
    const remain = exp > now ? Math.ceil((exp - now) / 1000) : 0;
    setCooldown(remain);
    const timer = setInterval(() => {
      const n = Date.now();
      const r = exp > n ? Math.ceil((exp - n) / 1000) : 0;
      setCooldown(r);
      if (r <= 0) {
        clearInterval(timer);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [phone]);

  const sendCode = async () => {
    if (!phone) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await call('auth/multifactor', {
        type: 'sms',
        phoneOrEmail: phone,
        codeOrAssertion: 'request',
      });
      if (res.error) throw new Error(res.error.message || '发送失败');
      const sms = res.result?.sms;
      if (!sms || sms.Code !== 'OK' || sms.Success !== true) {
        throw new Error(sms?.Message || '短信发送失败');
      }
      const exp = Date.now() + 60000;
      localStorage.setItem(`idp_otp_exp:${phone}`, String(exp));
      setCooldown(60);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : '发送失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const onFinish = async (values: { code: string }) => {
    if (!phone) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await call('auth/multifactor', {
        type: 'sms',
        phoneOrEmail: phone,
        codeOrAssertion: values.code,
      });
      if (res.error) throw new Error(res.error.message || '校验失败');
      const state = sessionStorage.getItem('idp_state');
      if (state) {
        const enterRes = await call('auth/enter', {
          state,
        });
        if (enterRes.error) throw new Error('进入失败');
        const redirectTo = enterRes.result?.redirectTo;
        if (redirectTo) {
          window.location.href = redirectTo;
          return;
        }
      }
      navigate('/finish', { state: { fromNormalFlow: true } });
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : '校验失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title='多重身份验证' subtitle='请输入短信验证码'>
      <div style={{ maxWidth: 420, margin: '0 auto' }}>
        <Typography.Title level={3} style={{ textAlign: 'center' }}>
          短信验证码校验
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
            {cooldown > 0 ? `重新发送(${cooldown}s)` : '发送验证码'}
          </Button>
        </div>
        <Form layout='vertical' onFinish={onFinish} disabled={loading}>
          <Form.Item
            label='验证码'
            name='code'
            rules={[{ required: true, message: '验证码不能为空' }]}
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
              提交验证
            </Button>
          </Form.Item>
        </Form>
      </div>
    </AuthLayout>
  );
}
