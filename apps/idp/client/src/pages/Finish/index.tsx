import { generatePKCE, generateRandomString } from '@csisp/auth/browser';
import { OIDCScope } from '@csisp/idl/idp';
import type {
  SessionResult,
  Next,
  AuthorizationInitResult,
  ClientInfo,
} from '@csisp/idl/idp';
import { Card, Space, Typography, Alert, Button, Modal } from 'antd';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { authCall, oidcCall, hasError } from '@/api/rpc';
import { CLIENT_LOGIN_URLS } from '@/config';

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
  const navigate = useNavigate();
  const [userLabel, setUserLabel] = useState<string>('已登录');
  const fromNormalFlow =
    !!(location.state as any)?.fromNormalFlow ||
    new URLSearchParams(window.location.search).get('flow') === 'normal';
  const fromGuard =
    !!(location.state as any)?.fromGuard ||
    new URLSearchParams(window.location.search).get('fromGuard') === '1';

  useEffect(() => {
    if (fromNormalFlow) {
      const flowState = location.state as any;
      const ticket = flowState?.ticket;
      const state = flowState?.state;
      if (ticket || state) {
        setLoading(true);
        authCall<Next>('enter', { ticket, state })
          .then(res => {
            if (!hasError(res)) {
              const redirectTo = res.result?.redirectTo;
              if (redirectTo) {
                window.location.href = redirectTo;
              }
            } else {
              setErrorMsg(res.error.message || '进入失败');
            }
          })
          .catch(() => {
            setErrorMsg('进入系统请求失败');
          })
          .finally(() => {
            setLoading(false);
          });
      }
    }
  }, [fromNormalFlow, location.state]);

  useEffect(() => {
    (async () => {
      try {
        const res = await oidcCall<ClientInfo[]>('clients', {});
        if (hasError(res))
          throw new Error(res.error.message || '获取系统列表失败');
        const data = res.result;
        setItems(Array.isArray(data) ? data : []);
      } catch {
        setErrorMsg('获取系统列表失败');
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await authCall<SessionResult>('session', {});
        if (!hasError(res)) {
          const n = (res.result as any)?.name as string | undefined;
          const sid = (res.result as any)?.student_id as string | undefined;
          if (n && sid) setUserLabel(`${n}（${sid}）`);
          else if (sid) setUserLabel(`（${sid}）`);
          else if (n) setUserLabel(n);
        }
      } catch {}
    })();
  }, []);

  const handleEnter = async (item: ClientInfo) => {
    if (!item.default_redirect_uri) return;

    // 如果配置了专门的登录入口，则跳转到该入口以保证 PKCE 流程完整
    const clientId = item.client_id;
    if (clientId && CLIENT_LOGIN_URLS[clientId]) {
      window.location.href = CLIENT_LOGIN_URLS[clientId];
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      const state = generateRandomString(32);
      const { verifier, challenge } = await generatePKCE();
      // 使用生成的 verifier
      sessionStorage.setItem('idp_state', state);
      sessionStorage.setItem(`cv:${state}`, verifier);
      const authRes = await oidcCall<AuthorizationInitResult>('authorize', {
        response_type: 'code',
        client_id: item.client_id,
        redirect_uri: item.default_redirect_uri,
        scope: scopeEnumsToString(item.scopes),
        state,
        code_challenge_method: 'S256',
        code_challenge: challenge,
        nonce: generateRandomString(16),
      });
      if (hasError(authRes) || !authRes.result?.ok)
        throw new Error('授权态创建失败');
      const enterRes = await authCall<Next>('enter', {
        state,
      });
      if (hasError(enterRes)) throw new Error('进入失败');
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

  const handleLogout = async () => {
    Modal.confirm({
      title: '确认退出登录？',
      onOk: async () => {
        try {
          const res = await authCall<SessionResult>('session', {
            logout: true,
          });
          if (hasError(res)) throw new Error('退出失败');
          sessionStorage.removeItem('idp_studentId');
          navigate('/login');
        } catch {
          setErrorMsg('退出失败，请重试');
        }
      },
    });
  };

  return (
    <div style={{ maxWidth: 720, margin: '32px auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div />
        <Space>
          <Typography.Text>{userLabel}</Typography.Text>
          <Button type='link' onClick={handleLogout}>
            退出登录
          </Button>
        </Space>
      </div>
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
