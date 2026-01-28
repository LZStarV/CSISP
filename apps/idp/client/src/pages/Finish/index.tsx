import { Card, Space, Typography, Alert, Button } from 'antd';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { randomString, s256 } from '@/api/pkce';
import { call } from '@/api/rpc';

type ClientItem = {
  client_id: string;
  name?: string | null;
  default_redirect_uri?: string | null;
  scopes?: string[] | null;
};

export function Finish() {
  const [items, setItems] = useState<ClientItem[]>([]);
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
        const res = await call('oidc/clients', {});
        if (res.error) throw new Error(res.error.message || '获取系统列表失败');
        const data = res.result;
        setItems(Array.isArray(data) ? data : []);
      } catch {
        setErrorMsg('获取系统列表失败');
      }
    })();
  }, []);

  const handleEnter = async (item: ClientItem) => {
    if (!item.default_redirect_uri) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const state = randomString(32);
      const verifier = randomString(64);
      const challenge = await s256(verifier);
      sessionStorage.setItem('idp_state', state);
      sessionStorage.setItem(`cv:${state}`, verifier);
      const url = new URL('/api/idp/oidc/authorize', window.location.origin);
      url.searchParams.set('response_type', 'code');
      url.searchParams.set('client_id', item.client_id);
      url.searchParams.set('redirect_uri', item.default_redirect_uri);
      url.searchParams.set('scope', (item.scopes || ['openid']).join(' '));
      url.searchParams.set('state', state);
      url.searchParams.set('code_challenge_method', 'S256');
      url.searchParams.set('code_challenge', challenge);
      url.searchParams.set('nonce', randomString(16));
      const res = await fetch(url.toString(), {
        method: 'GET',
        credentials: 'include',
      });
      const data = await res.json();
      if (!data || !data.ok) throw new Error('授权态创建失败');
      const enterRes = await call('auth/enter', {
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
