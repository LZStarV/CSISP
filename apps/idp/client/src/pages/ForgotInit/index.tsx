import { MFAType, RecoveryUnavailableReason } from '@csisp/idl/idp';
import {
  Card,
  Space,
  Typography,
  Alert,
  Button,
  Form,
  Input,
  Tooltip,
} from 'antd';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { call, hasError } from '@/api/rpc';
import { AuthLayout } from '@/layouts/AuthLayout';
import { ROUTE_MFA_SMS, ROUTE_LOGIN } from '@/routes/router';
import { MFA_METHOD_LABELS, MFA_METHOD_DESCRIPTIONS } from '@/types/auth';

export function ForgotInit() {
  const [studentId, setStudentId] = useState('');
  const [methods, setMethods] = useState<
    Array<{
      type: MFAType;
      enabled: boolean;
      extra?: string | null;
      reason?: RecoveryUnavailableReason | null;
    }>
  >([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const reasonText = (reason?: RecoveryUnavailableReason | null) => {
    if (reason == null) return '';
    switch (reason) {
      case RecoveryUnavailableReason.NotBoundPhone:
        return '未绑定手机号';
      case RecoveryUnavailableReason.NotBoundEmail:
        return '未绑定邮箱';
      case RecoveryUnavailableReason.MethodDisabled:
        return '该方式未启用';
      case RecoveryUnavailableReason.NotImplemented:
        return '该方式暂未实现';
      case RecoveryUnavailableReason.PolicyDenied:
        return '策略不允许使用该方式';
      default:
        return '暂不可用';
    }
  };

  const onSubmit = async () => {
    if (!studentId) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await call<import('@csisp/idl/idp').RecoveryInitResult>(
        'auth/forgot_init',
        {
          studentId,
        }
      );
      if (hasError(res))
        throw new Error(res.error.message || '获取可用方式失败');
      const list = (res.result?.methods ?? []) as any[];
      setMethods(Array.isArray(list) ? list : []);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : '获取可用方式失败');
    } finally {
      setLoading(false);
    }
  };

  const choose = (method: {
    type: MFAType;
    enabled: boolean;
    extra?: string | null;
  }) => {
    if (!method.enabled) return;
    if (method.type === MFAType.Sms) {
      const qs = new URLSearchParams({
        studentId,
        flow: 'forgot',
      }).toString();
      navigate(`${ROUTE_MFA_SMS}?${qs}`);
    }
  };

  return (
    <AuthLayout title='找回密码' subtitle='输入学号并选择一种验证方式'>
      <div style={{ maxWidth: 720, margin: '32px auto' }}>
        <Typography.Title level={3} style={{ textAlign: 'center' }}>
          忘记密码
        </Typography.Title>
        {errorMsg && (
          <Alert
            type='error'
            message={errorMsg}
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}
        <Form layout='vertical' disabled={loading} onFinish={onSubmit}>
          <Form.Item
            label='学号'
            name='studentId'
            rules={[{ required: true, message: '学号不能为空' }]}
          >
            <Input
              placeholder='请输入学号'
              value={studentId}
              onChange={e => setStudentId(e.target.value)}
            />
          </Form.Item>
          <Form.Item>
            <Button type='primary' htmlType='submit' loading={loading} block>
              查询可用验证方式
            </Button>
          </Form.Item>
        </Form>

        {methods.length > 0 && (
          <Space direction='vertical' style={{ width: '100%' }} size='middle'>
            {methods.map(m => {
              const label = MFA_METHOD_LABELS[m.type as MFAType];
              const description = MFA_METHOD_DESCRIPTIONS[m.type as MFAType];
              const disabled = !m.enabled;
              const extra = m.extra ?? null;
              const reason = reasonText(m.reason ?? null);
              return (
                <Card
                  key={String(m.type)}
                  hoverable={!disabled}
                  onClick={() => choose(m as any)}
                  style={{
                    opacity: disabled ? 0.6 : 1,
                    cursor: disabled ? 'not-allowed' : 'pointer',
                  }}
                >
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: 16 }}
                  >
                    <div style={{ flex: 1 }}>
                      <Typography.Title
                        level={4}
                        style={{ margin: 0, marginBottom: 4 }}
                      >
                        {label}
                      </Typography.Title>
                      <Typography.Text type='secondary'>
                        {extra ? `${description}（${extra}）` : description}
                      </Typography.Text>
                    </div>
                    {disabled ? (
                      <Tooltip title={reason}>
                        <Button disabled>不可用</Button>
                      </Tooltip>
                    ) : (
                      <Button type='primary'>选择</Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </Space>
        )}
        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <Button type='link' onClick={() => navigate(ROUTE_LOGIN)}>
            返回登录
          </Button>
        </div>
      </div>
    </AuthLayout>
  );
}
