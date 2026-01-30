import {
  MobileOutlined,
  MailOutlined,
  KeyOutlined,
  QrcodeOutlined,
} from '@ant-design/icons';
import { MFAType, MfaMethodsResult } from '@csisp/idl/idp';
import { AuthNextStep } from '@csisp/idl/idp';
import { Card, Button, Typography, Space, Alert } from 'antd';
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { call, hasError } from '@/api/rpc';
import { AuthLayout } from '@/layouts/AuthLayout';
import {
  MFAMethod,
  MFA_METHOD_LABELS,
  MFA_METHOD_DESCRIPTIONS,
} from '@/types/auth';

const MFA_ICONS: Record<MFAType, React.ComponentType<any>> = {
  [MFAType.Sms]: MobileOutlined,
  [MFAType.Email]: MailOutlined,
  [MFAType.Fido2]: KeyOutlined,
  [MFAType.Otp]: QrcodeOutlined,
};

export function MFASelect() {
  const [loading, setLoading] = useState(false);
  const [mfaMethods, setMfaMethods] = useState<MFAMethod[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  async function loadMfa() {
    try {
      const res = await call<MfaMethodsResult>('auth/mfa_methods', {});
      if (
        res &&
        !hasError(res) &&
        Array.isArray(res.result?.multifactor) &&
        res.result.multifactor.length
      ) {
        setMfaMethods(res.result.multifactor);
        setErrorMsg(null);
      } else {
        setErrorMsg('未获取到验证方式列表，请返回登录重试');
        setMfaMethods([]);
      }
    } catch {
      setErrorMsg('获取验证方式失败，请返回登录重试');
      setMfaMethods([]);
    }
  }

  useEffect(() => {
    loadMfa();
  }, []);

  useEffect(() => {
    const state = location.state as {
      next?: AuthNextStep[];
      multifactor?: MFAMethod[];
    } | null;
    // 仅在没有错误提示时才使用路由状态覆盖列表
    if (!errorMsg && state?.multifactor?.length) {
      setMfaMethods(state.multifactor);
      setErrorMsg(null);
    }
  }, [location.state, errorMsg]);

  const handleMFASelect = async (method: MFAMethod) => {
    if (!method.enabled) return;

    setLoading(true);
    setErrorMsg(null);

    try {
      if (method.type === MFAType.Sms) {
        navigate('/mfa/sms', { state: { phone: method.extra } });
        return;
      }
      setErrorMsg('该验证方式暂未实现');
    } catch {
      setErrorMsg('选择验证方式失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const enabledMethods = mfaMethods.filter(method => method.enabled);

  return (
    <AuthLayout
      title='多重身份验证'
      subtitle='请选择您的验证方式'
      imagePrompt='Secure%20authentication%20illustration%20with%20multiple%20verification%20methods%2C%20modern%20design%2C%20blue%20and%20white%20colors'
    >
      <Typography.Title
        level={3}
        style={{ textAlign: 'center', marginBottom: 24 }}
      >
        选择验证方式
      </Typography.Title>

      {errorMsg && (
        <Alert
          type='error'
          message={errorMsg}
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {enabledMethods.length === 0 ? (
        <Alert
          type='warning'
          message='暂无可用的验证方式'
          description='请联系管理员启用多重身份验证'
          showIcon
        />
      ) : (
        <Space direction='vertical' style={{ width: '100%' }} size='middle'>
          {mfaMethods.map(method => {
            const IconComponent = MFA_ICONS[method.type as MFAType];
            const label = MFA_METHOD_LABELS[method.type as MFAType];
            const description = MFA_METHOD_DESCRIPTIONS[method.type as MFAType];

            return (
              <Card
                key={method.type}
                hoverable={method.enabled}
                onClick={() => handleMFASelect(method)}
                style={{
                  opacity: method.enabled ? 1 : 0.6,
                  cursor: method.enabled ? 'pointer' : 'not-allowed',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <IconComponent style={{ fontSize: 24, color: '#1890ff' }} />
                  <div style={{ flex: 1 }}>
                    <Typography.Title
                      level={4}
                      style={{ margin: 0, marginBottom: 4 }}
                    >
                      {label}
                    </Typography.Title>
                    <Typography.Text type='secondary'>
                      {method.extra
                        ? `${description} (${method.extra})`
                        : description}
                    </Typography.Text>
                  </div>
                  {method.enabled ? (
                    <Button type='primary' loading={loading}>
                      选择
                    </Button>
                  ) : (
                    <Button disabled>未启用</Button>
                  )}
                </div>
              </Card>
            );
          })}
        </Space>
      )}

      <div style={{ marginTop: 24, textAlign: 'center' }}>
        <Button type='link' onClick={() => navigate('/login')}>
          返回登录
        </Button>
      </div>
    </AuthLayout>
  );
}
