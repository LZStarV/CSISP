import { Button, Card, Spin, Alert, Typography } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { AuthLayout } from '@/layouts/AuthLayout';
import { getSupabaseClient } from '@/lib/supabase';
import { ROUTE_LOGIN, ROUTE_OAUTH_CONSENT } from '@/routes/router';

type Phase = 'checking' | 'consent' | 'error';

interface AuthDetails {
  client: { name: string };
  redirect_uri: string;
  scope?: string;
}

function redirectToLogin(
  navigate: ReturnType<typeof useNavigate>,
  authorizationId: string | null
) {
  const backTo = authorizationId
    ? `${ROUTE_OAUTH_CONSENT}?authorization_id=${encodeURIComponent(authorizationId)}`
    : undefined;
  const loginUrl = backTo
    ? `${ROUTE_LOGIN}?redirect=${encodeURIComponent(backTo)}`
    : ROUTE_LOGIN;
  navigate(loginUrl, { replace: true });
}

function isValidAuthDetails(data: unknown): data is AuthDetails {
  if (typeof data !== 'object' || data === null) return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d.client === 'object' &&
    d.client !== null &&
    typeof (d.client as Record<string, unknown>).name === 'string' &&
    typeof d.redirect_uri === 'string'
  );
}

function getScopeLabel(scope: string): string {
  const labels: Record<string, string> = {
    openid: '验证身份',
    email: '访问邮箱',
    profile: '访问基本资料',
  };
  return labels[scope] || scope;
}

export function OAuthConsent() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [phase, setPhase] = useState<Phase>('checking');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [authDetails, setAuthDetails] = useState<AuthDetails | null>(null);
  const [processing, setProcessing] = useState(false);
  const authorizationId = searchParams.get('authorization_id');
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    if (!authorizationId) {
      setPhase('error');
      setErrorMsg('缺少授权ID');
      return;
    }

    hasRun.current = true;

    async function run() {
      const supabase = getSupabaseClient();

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          redirectToLogin(navigate, authorizationId);
          return;
        }

        const { data, error } =
          await supabase.auth.oauth.getAuthorizationDetails(authorizationId!);

        if (error) {
          setPhase('error');
          setErrorMsg(error.message);
          return;
        }

        if (
          typeof (data as Record<string, unknown>).redirect_url === 'string'
        ) {
          window.location.href = (data as Record<string, unknown>)
            .redirect_url as string;
          return;
        }

        if (!isValidAuthDetails(data)) {
          setPhase('error');
          setErrorMsg(t('oauth.invalidData', '收到无效的授权数据'));
          return;
        }

        setAuthDetails(data);
        setPhase('consent');
      } catch (e) {
        setPhase('error');
        setErrorMsg(
          e instanceof Error
            ? e.message
            : t('oauth.loadFailed', '加载授权信息失败')
        );
      }
    }

    run();
  }, [authorizationId, navigate, t]);

  const handleApprove = async () => {
    if (!authorizationId) return;
    setProcessing(true);
    setErrorMsg(null);

    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.auth.oauth.approveAuthorization(
        authorizationId!
      );

      if (error) {
        setErrorMsg(error.message);
        setProcessing(false);
        return;
      }

      try {
        await supabase.auth.signOut({ scope: 'local' });
      } catch {}

      window.location.href = (data as any).redirect_url;
    } catch (e) {
      setErrorMsg(
        e instanceof Error
          ? e.message
          : t('oauth.approveFailed', '授权失败，请重试')
      );
      setProcessing(false);
    }
  };

  const handleCancel = async () => {
    if (!authorizationId) {
      navigate(ROUTE_LOGIN);
      return;
    }
    setProcessing(true);

    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.auth.oauth.denyAuthorization(
        authorizationId!
      );

      if (error) {
        setErrorMsg(error.message);
        setProcessing(false);
        return;
      }
      window.location.href = (data as any).redirect_url;
    } catch (e) {
      setErrorMsg(
        e instanceof Error ? e.message : t('oauth.cancelFailed', '取消授权失败')
      );
      setProcessing(false);
    }
  };

  if (phase === 'checking') {
    return (
      <AuthLayout
        title={t('oauth.consentTitle', '授权确认')}
        subtitle={t('oauth.consentSubtitle', '正在验证身份...')}
      >
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size='large' />
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title={t('oauth.consentTitle', '授权确认')}
      subtitle={t('oauth.consentSubtitle', '请确认是否授权此应用访问您的信息')}
    >
      {errorMsg && (
        <Alert
          type='error'
          message={errorMsg}
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}
      {authDetails ? (
        <Card
          style={{ maxWidth: 400, margin: '0 auto' }}
          title={
            <div style={{ textAlign: 'center' }}>
              <Typography.Title level={4} style={{ margin: 0 }}>
                {t('oauth.appRequestTitle', '{{appName}} 申请访问您的信息', {
                  appName: authDetails.client.name ?? '应用',
                })}
              </Typography.Title>
            </div>
          }
        >
          <div style={{ marginBottom: 24 }}>
            <Typography.Paragraph type='secondary' style={{ marginBottom: 16 }}>
              {t('oauth.scopeDescription', '此应用将获得以下权限：')}
            </Typography.Paragraph>
            {authDetails.scope ? (
              <ul style={{ listStyleType: 'disc', paddingLeft: 24, margin: 0 }}>
                {authDetails.scope.split(' ').map((scope, index) => (
                  <li key={index} style={{ marginBottom: 8 }}>
                    <Typography.Text>
                      {t(`oauth.scope.${scope}`, getScopeLabel(scope))}
                    </Typography.Text>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <Button onClick={handleCancel} block disabled={processing}>
              {t('oauth.cancel', '取消')}
            </Button>
            <Button
              type='primary'
              onClick={handleApprove}
              block
              loading={processing}
            >
              {t('oauth.approve', '授权')}
            </Button>
          </div>
        </Card>
      ) : (
        <Alert
          type='warning'
          message={t('oauth.noDetails', '无法获取授权详情，请稍后重试')}
          showIcon
        />
      )}
    </AuthLayout>
  );
}
