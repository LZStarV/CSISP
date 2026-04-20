import type { CreateExchangeCodeResult } from '@csisp/contracts';
import { Card, Space, Typography, Alert, Button, Modal } from 'antd';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { commonAuthCall } from '@/api/common/auth';
import { commonOidcCall } from '@/api/common/oidc';
import { idpClientAuthCall } from '@/api/idp-client/auth';
import { CLIENT_LOGIN_ENDPOINTS } from '@/config';
import type { SessionResult, Next, ClientInfo } from '@/types/enum';
import { generateRandomString } from '@/utils/pkce';

// no-op

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
        (async () => {
          try {
            const res = await idpClientAuthCall<Next>('enter', {
              ticket,
              state,
            });
            const redirectTo = res?.redirectTo;
            if (redirectTo) {
              window.location.href = redirectTo;
            }
          } catch (error) {
            setErrorMsg(
              error instanceof Error ? error.message : '进入系统请求失败'
            );
          } finally {
            setLoading(false);
          }
        })();
      }
    }
  }, [fromNormalFlow, location.state]);

  useEffect(() => {
    (async () => {
      try {
        const data = await commonOidcCall<ClientInfo[]>('clients', {});
        setItems(Array.isArray(data) ? data : []);
      } catch (error) {
        setErrorMsg(
          error instanceof Error ? error.message : '获取系统列表失败'
        );
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await commonAuthCall<SessionResult>('session', {});
        const n = (res as any)?.name as string | undefined;
        const sid = (res as any)?.student_id as string | undefined;
        if (n && sid) setUserLabel(`${n}（${sid}）`);
        else if (sid) setUserLabel(`（${sid}）`);
        else if (n) setUserLabel(n);
      } catch {}
    })();
  }, []);

  const handleEnter = async (item: ClientInfo) => {
    if (!item.default_redirect_uri) return;

    // 如果配置了专门的登录入口，则跳转到该入口以保证 PKCE 流程完整
    const clientId = item.client_id;
    if (clientId && CLIENT_LOGIN_ENDPOINTS[clientId]) {
      const endpoint = CLIENT_LOGIN_ENDPOINTS[clientId];
      const form = document.createElement('form');
      form.method = 'post';
      form.action = endpoint;
      document.body.appendChild(form);
      form.submit();
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      const state = generateRandomString(16);
      const res = await idpClientAuthCall<CreateExchangeCodeResult>(
        'createExchangeCode',
        {
          app_id: String(item.client_id),
          redirect_uri: item.default_redirect_uri as string,
          state,
        }
      );
      const code = res?.code;
      const uri = res?.redirect_uri;
      const st = res?.state;
      if (!code || !uri) throw new Error('创建会话失败');
      const url =
        uri +
        `?code=${encodeURIComponent(code)}` +
        (st ? `&state=${encodeURIComponent(st)}` : '');
      window.location.replace(url);
      return;
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
          await commonAuthCall<SessionResult>('logout', {});
          sessionStorage.removeItem('idp_studentId');
          navigate('/login');
        } catch (error) {
          setErrorMsg(
            error instanceof Error ? error.message : '退出失败，请重试'
          );
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
