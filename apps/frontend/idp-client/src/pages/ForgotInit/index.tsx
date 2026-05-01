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
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { idpClientAuthApi } from '@/api/idp-client/auth';
import { AuthLayout } from '@/layouts/AuthLayout';
import { ROUTE_LOGIN } from '@/routes/router';
import { MFA_METHOD_LABELS, MFA_METHOD_DESCRIPTIONS } from '@/types/auth';
import { MFAType, RecoveryUnavailableReason } from '@/types/enum';

export function ForgotInit() {
  const { t } = useTranslation();
  const [studentId, setStudentId] = useState('');
  const [email, setEmail] = useState('');
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
        return t('mfa.sms.label', '未绑定手机号');
      case RecoveryUnavailableReason.NotBoundEmail:
        return t('mfa.email.label', '未绑定邮箱');
      case RecoveryUnavailableReason.MethodDisabled:
        return t('mfa.disabled', '该方式未启用');
      case RecoveryUnavailableReason.NotImplemented:
        return t('mfa.notImpl', '该方式暂未实现');
      case RecoveryUnavailableReason.PolicyDenied:
        return t('mfa.policyDenied', '策略不允许使用该方式');
      default:
        return t('common.unavailable', '暂不可用');
    }
  };

  const onSubmit = async () => {
    if (!studentId) return;
    if (!email) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await idpClientAuthApi.forgotInit({
        email,
      });
      const list = (res?.methods ?? []) as any[];
      setMethods(Array.isArray(list) ? list : []);
    } catch (e) {
      setErrorMsg(
        e instanceof Error
          ? e.message
          : t('oidc.getMethodsFailed', '获取可用方式失败')
      );
    } finally {
      setLoading(false);
    }
  };

  const choose = (_method: {
    type: MFAType;
    enabled: boolean;
    extra?: string | null;
  }) => {
    // 暂不支持短信找回
  };

  return (
    <AuthLayout
      title={t('forgot.init.title', '找回密码')}
      subtitle={t('validation.studentId.select', '输入学号并选择一种验证方式')}
    >
      <div style={{ maxWidth: 720, margin: '32px auto' }}>
        <Typography.Title level={3} style={{ textAlign: 'center' }}>
          {t('forgot.init.title', '忘记密码')}
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
            label={t('validation.studentId.label', '学号')}
            name='studentId'
            rules={[
              {
                required: true,
                message:
                  t('validation.studentId.label', '学号') +
                  t('common.disabled', '不能为空'),
              },
            ]}
          >
            <Input
              placeholder={t('validation.studentId.placeholder', '请输入学号')}
              value={studentId}
              onChange={e => setStudentId(e.target.value)}
            />
          </Form.Item>
          <Form.Item
            label={t('forgot.init.email.label', '邮箱')}
            name='email'
            rules={[
              {
                required: true,
                message: t('forgot.init.email.required', '邮箱不能为空'),
              },
              {
                type: 'email' as any,
                message: t('login.email.invalid', '邮箱格式不正确'),
              },
            ]}
          >
            <Input
              placeholder={t('forgot.init.email.placeholder', '请输入邮箱')}
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </Form.Item>
          <Form.Item>
            <Button type='primary' htmlType='submit' loading={loading} block>
              {t('common.queryMethods', '查询可用验证方式')}
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
                        <Button disabled>
                          {t('common.unavailable', '不可用')}
                        </Button>
                      </Tooltip>
                    ) : (
                      <Button type='primary'>
                        {t('common.select', '选择')}
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </Space>
        )}
        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <Button type='link' onClick={() => navigate(ROUTE_LOGIN)}>
            {t('forgot.init.backToLogin', '返回登录')}
          </Button>
        </div>
      </div>
    </AuthLayout>
  );
}
