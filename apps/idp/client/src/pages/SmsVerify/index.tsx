import { MFAType, VerifyResult } from '@csisp/idl/idp';
import type { Next, RecoveryInitResult } from '@csisp/idl/idp';
import { Alert, Button, Form, Input, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { authCall, hasError } from '@/api/rpc';
import { AuthLayout } from '@/layouts/AuthLayout';
import {
  ROUTE_LOGIN,
  ROUTE_PASSWORD_RESET,
  ROUTE_FINISH,
} from '@/routes/router';

export function SmsVerify() {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | undefined>(undefined);
  const [codeValue, setCodeValue] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [expireAt, setExpireAt] = useState<number>(0);
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const fromForgot = params.get('flow') === 'forgot';
  const studentId = params.get('studentId') || undefined;

  useEffect(() => {
    if (fromForgot && !studentId) {
      navigate(ROUTE_LOGIN);
      return;
    }
    if (fromForgot && studentId) {
      (async () => {
        try {
          const res = await authCall<RecoveryInitResult>('forgot_init', {
            studentId,
          });
          if (!hasError(res)) {
            const methods = (res.result?.methods ?? []) as any[];
            const sms = methods.find(m => m?.type === MFAType.Sms);
            setPhone((sms?.extra as string | undefined) ?? undefined);
          }
        } catch {
          // ignore
        }
      })();
    }
  }, [fromForgot, studentId]);

  useEffect(() => {
    if (!phone) return;
    const key = `idp_otp_exp:${phone}`;
    const expStr = localStorage.getItem(key);
    const exp = expStr ? Number(expStr) : 0;
    setExpireAt(exp);
  }, [phone]);

  useEffect(() => {
    if (!expireAt || expireAt <= 0) return;
    const now = Date.now();
    const initialRemain =
      expireAt > now ? Math.ceil((expireAt - now) / 1000) : 0;
    setCooldown(initialRemain);
    const timer = setInterval(() => {
      const now2 = Date.now();
      const remain2 = expireAt > now2 ? Math.ceil((expireAt - now2) / 1000) : 0;
      setCooldown(remain2);
      if (remain2 <= 0) {
        clearInterval(timer);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [expireAt]);

  // 发送短信验证码
  const sendCode = async () => {
    if (!phone) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      let res: any;
      if (fromForgot && studentId) {
        res = await authCall<Next>('forgot_challenge', {
          type: 'sms',
          studentId,
        });
      } else {
        res = await authCall<Next>('multifactor', {
          type: MFAType.Sms,
          phoneOrEmail: phone,
          codeOrAssertion: 'request',
        });
      }
      if (hasError(res)) throw new Error(res.error.message || '发送失败');
      const sms = res.result.sms;
      if (sms && sms.success === false) {
        throw new Error(sms.message || '短信发送失败');
      }
      const exp = Date.now() + 60000;
      localStorage.setItem(`idp_otp_exp:${phone}`, String(exp));
      setExpireAt(exp);
      setCooldown(60);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : '发送失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 校验短信验证码
  const onFinish = async (values: { code: string }) => {
    if (!phone) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      if (fromForgot && studentId) {
        const res = await authCall<VerifyResult>('forgot_verify', {
          type: 'sms',
          studentId,
          code: codeValue,
        });
        if (hasError(res)) throw new Error(res.error.message || '校验失败');
        const token = res.result?.reset_token;
        if (!token) throw new Error('校验失败');
        if (studentId) {
          sessionStorage.setItem(`idp_reset_token:${studentId}`, token);
        }
        const qs = new URLSearchParams({
          studentId: studentId || '',
        }).toString();
        navigate(`${ROUTE_PASSWORD_RESET}?${qs}`);
      } else {
        const res = await authCall<Next>('multifactor', {
          type: MFAType.Sms,
          phoneOrEmail: phone,
          codeOrAssertion: codeValue,
        });
        if (hasError(res)) throw new Error(res.error.message || '校验失败');
        const state = sessionStorage.getItem('idp_state');
        if (state) {
          const enterRes = await authCall<Next>('enter', { state });
          if (hasError(enterRes)) throw new Error('进入失败');
          const redirectTo = enterRes.result?.redirectTo;
          if (redirectTo) {
            window.location.href = redirectTo;
            return;
          }
        }
        navigate(ROUTE_FINISH, { state: { fromNormalFlow: true } });
      }
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
