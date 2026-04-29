import { Card, Space, Typography, Alert, Button, Modal } from 'antd';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';

import { commonAuthApi } from '@/api/common/auth';
import { commonOidcApi } from '@/api/common/oidc';
import { idpClientAuthApi } from '@/api/idp-client/auth';
import { CLIENT_LOGIN_ENDPOINTS } from '@/config';
import type { ClientInfo } from '@/types/enum';
import { generateRandomString } from '@/utils/pkce';

export function Finish() {
  const { t } = useTranslation('common');
  const [items, setItems] = useState<ClientInfo[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [userLabel, setUserLabel] = useState<string>(
    t('session.loggedIn', '已登录')
  );
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
            const res = await idpClientAuthApi.enter({
              ticket,
              state,
            });
            const redirectTo = res?.redirectTo;
            if (redirectTo) {
              window.location.href = redirectTo;
            }
          } catch (error) {
            setErrorMsg(
              error instanceof Error
                ? error.message
                : t('enter.systemFailed', '进入系统请求失败')
            );
          } finally {
            setLoading(false);
          }
        })();
      }
    }
  }, [fromNormalFlow, location.state, t]);

  useEffect(() => {
    (async () => {
      try {
        const data = await commonOidcApi.clients();
        setItems(Array.isArray(data) ? data : []);
      } catch (error) {
        setErrorMsg(
          error instanceof Error
            ? error.message
            : t('enter.getSystemListFailed', '获取系统列表失败')
        );
      }
    })();
  }, [t]);

  useEffect(() => {
    (async () => {
      try {
        const res = await commonAuthApi.session();
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
      const res = await idpClientAuthApi.createExchangeCode({
        app_id: String(item.client_id),
        redirect_uri: item.default_redirect_uri as string,
        state,
      });
      const code = res?.code;
      const uri = res?.redirect_uri;
      const st = res?.state;
      if (!code || !uri)
        throw new Error(t('session.createFailed', '创建会话失败'));
      const url =
        uri +
        `?code=${encodeURIComponent(code)}` +
        (st ? `&state=${encodeURIComponent(st)}` : '');
      window.location.replace(url);
      return;
    } catch (e) {
      setErrorMsg(
        e instanceof Error
          ? e.message
          : t('enter.failed', '进入系统失败，请重试')
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Modal.confirm({
      title: t('logout.title', '确认退出登录？'),
      onOk: async () => {
        try {
          await commonAuthApi.logout();
          sessionStorage.removeItem('idp_studentId');
          navigate('/login');
        } catch (error) {
          setErrorMsg(
            error instanceof Error
              ? error.message
              : t('logout.failed', '退出失败，请重试')
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
            {t('logout.submit', '退出登录')}
          </Button>
        </Space>
      </div>
      <Typography.Title level={3} style={{ textAlign: 'center' }}>
        {t('session.loggedInUnified', '已登录到统一身份认证')}
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
          message={t('login.alreadyLoggedIn', '您已登录，可直接选择系统进入')}
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}
      <Typography.Paragraph style={{ textAlign: 'center' }}>
        {t('enter.title', '选择要进入的系统')}
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
                {t('enter.submit', '进入')}
              </Button>
            </div>
          </Card>
        ))}
      </Space>
    </div>
  );
}
