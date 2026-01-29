import { OIDCScope } from '@csisp/idl/idp';
import type { ClientInfo } from '@csisp/idl/idp';
import type { AuthorizationInitResult } from '@csisp/idl/idp';
import { Card, Space, Typography, Alert, Button } from 'antd';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { randomString, s256 } from '@/api/pkce';
import { call } from '@/api/rpc';

// 将 OIDCScope 枚举值转换为字符串
function scopeEnumsToString(scopes?: Array<OIDCScope> | null): string {
  if (!scopes || !Array.isArray(scopes) || scopes.length === 0) return 'openid';
  const map: Record<OIDCScope, string> = {
    [OIDCScope.Openid]: 'openid',
    [OIDCScope.Profile]: 'profile',
    [OIDCScope.Email]: 'email',
  };
  return scopes
    .map(s => map[s as OIDCScope] ?? null)
    .filter((x): x is string => !!x)
    .join(' ');
}

export function Finish() {
  const [items, setItems] = useState<ClientInfo[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const fromNormalFlow =
    !!(location.state as any)?.fromNormalFlow ||
    new URLSearchParams(window.location.search).get('flow') === 'normal';
  const fromGuard =
    !!(location.state as any)?.fromGuard ||
    new URLSearchParams(window.location.search).get('fromGuard') === '1';

  useEffect(() => {
    (async () => {
      try {
        const res = await call<ClientInfo[]>('oidc/clients', {});
        if (res.error) throw new Error(res.error.message || '获取系统列表失败');
        const data = res.result;
        setItems(Array.isArray(data) ? data : []);
      } catch {
        setErrorMsg('获取系统列表失败');
      }
    })();
  }, []);

  const handleEnter = async (item: ClientInfo) => {
    if (!item.default_redirect_uri) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const state = randomString(32);
      const verifier = randomString(64);
      const challenge = await s256(verifier);
      sessionStorage.setItem('idp_state', state);
      sessionStorage.setItem(`cv:${state}`, verifier);
      const authRes = await call<AuthorizationInitResult>('oidc/authorize', {
        response_type: 'code',
        client_id: item.client_id,
        redirect_uri: item.default_redirect_uri,
        scope: scopeEnumsToString(item.scopes),
        state,
        code_challenge_method: 'S256',
        code_challenge: challenge,
        nonce: randomString(16),
      });
      if (authRes.error || !authRes.result?.ok)
        throw new Error('授权态创建失败');
      const enterRes = await call<import('@csisp/idl/idp').Next>('auth/enter', {
        state,
      });
      const redirectTo = enterRes.result?.redirectTo;
      if (redirectTo) {
        window.location.href = redirectTo;
        return;
      }
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : '进入系统失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 720, margin: '32px auto' }}>
      <Typography.Title level={3} style={{ textAlign: 'center' }}>
        已登录到统一身份认证
      </Typography.Title>
      {errorMsg && (
        <Alert
          type='error'
          message={errorMsg}
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}
      {!fromNormalFlow && fromGuard && (
        <Alert
          type='info'
          message='您已登录，可直接选择系统进入'
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}
      <Typography.Paragraph style={{ textAlign: 'center' }}>
        选择要进入的系统
      </Typography.Paragraph>
      <Space direction='vertical' style={{ width: '100%' }} size='middle'>
        {items.map(item => (
          <Card key={item.client_id}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <Typography.Text strong>
                  {item.name || item.client_id}
                </Typography.Text>
                <div>
                  <Typography.Text type='secondary'>
                    {item.default_redirect_uri}
                  </Typography.Text>
                </div>
              </div>
              <Button
                type='primary'
                loading={loading}
                onClick={() => handleEnter(item)}
              >
                进入
              </Button>
            </div>
          </Card>
        ))}
      </Space>
    </div>
  );
}
