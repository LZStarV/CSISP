import { Button, Card, Typography, Spin, Alert } from 'antd';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { AuthLayout } from '@/layouts/AuthLayout';
import { getSupabaseClient } from '@/lib/supabase';
import { ROUTE_LOGIN } from '@/routes/router';
import { useAuthStore } from '@/stores/auth';

export function OAuthConsent() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { clearFlowState } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [authDetails, setAuthDetails] = useState<{
    client: { name: string };
    redirect_uri: string;
    scope?: string;
  } | null>(null);

  // 从 URL 获取 authorization_id
  const authorizationId = searchParams.get('authorization_id');

  useEffect(() => {
    async function loadAuthDetails() {
      if (!authorizationId) {
        setErrorMsg('缺少授权ID');
        setLoading(false);
        return;
      }

      const supabase = getSupabaseClient();

      // 检查用户是否已登录
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        // 如果未登录，重定向到登录页，保留 authorization_id
        navigate(
          `${ROUTE_LOGIN}?redirect=/oauth/consent?authorization_id=${authorizationId}`,
          { replace: true }
        );
        return;
      }

      // 获取授权详情
      const { data, error } =
        await supabase.auth.oauth.getAuthorizationDetails(authorizationId);

      if (error) {
        setErrorMsg(error.message);
        setLoading(false);
        return;
      }

      // 判断是否为重定向还是授权详情
      if ('redirect_to' in data) {
        // 如果是重定向，直接跳转
        window.location.href = (data as { redirect_to: string }).redirect_to;
        return;
      }

      // 否则设置授权详情
      setAuthDetails(data as any);
      setLoading(false);
    }

    loadAuthDetails();
  }, [authorizationId, navigate]);

  const handleApprove = async () => {
    if (!authorizationId) return;

    setProcessing(true);
    setErrorMsg(null);

    try {
      clearFlowState();

      const supabase = getSupabaseClient();
      const { data, error } =
        await supabase.auth.oauth.approveAuthorization(authorizationId);

      if (error) {
        setErrorMsg(error.message);
        return;
      }

      // 重定向到返回 URL
      window.location.href = (data as any).redirect_to;
    } catch (e) {
      setErrorMsg(
        e instanceof Error
          ? e.message
          : t('oauth.approveFailed', '授权失败，请重试')
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleCancel = async () => {
    if (!authorizationId) {
      navigate(ROUTE_LOGIN);
      return;
    }

    setProcessing(true);
    clearFlowState();

    try {
      const supabase = getSupabaseClient();
      const { data, error } =
        await supabase.auth.oauth.denyAuthorization(authorizationId);

      if (error) {
        setErrorMsg(error.message);
        return;
      }

      // 重定向到返回 URL（包含错误信息）
      window.location.href = (data as any).redirect_to;
    } catch (e) {
      setErrorMsg(
        e instanceof Error
          ? e.message
          : t('oauth.approveFailed', '拒绝授权失败，请重试')
      );
      setProcessing(false);
    }
  };

  return (
    <AuthLayout
      title={t('oauth.consentTitle', '授权确认')}
      subtitle={t('oauth.consentSubtitle', '请确认是否授权此应用访问您的信息')}
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size='large' />
        </div>
      ) : (
        <>
          {errorMsg && (
            <Alert
              type='error'
              message={errorMsg}
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}
          <Card
            style={{ maxWidth: 400, margin: '0 auto' }}
            title={
              <div style={{ textAlign: 'center' }}>
                <Typography.Title level={4} style={{ margin: 0 }}>
                  {t('oauth.appRequestTitle', '{{appName}} 申请访问您的信息', {
                    appName: authDetails?.client.name || '应用',
                  })}
                </Typography.Title>
              </div>
            }
          >
            <div style={{ marginBottom: 24 }}>
              <Typography.Paragraph
                type='secondary'
                style={{ marginBottom: 16 }}
              >
                {t('oauth.scopeDescription', '此应用将获得以下权限：')}
              </Typography.Paragraph>
              {authDetails?.scope && (
                <ul
                  style={{ listStyleType: 'disc', paddingLeft: 24, margin: 0 }}
                >
                  {authDetails.scope.split(' ').map((scope, index) => (
                    <li key={index} style={{ marginBottom: 8 }}>
                      <Typography.Text>
                        {t(`oauth.scope.${scope}`, getScopeLabel(scope))}
                      </Typography.Text>
                    </li>
                  ))}
                </ul>
              )}
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
        </>
      )}
    </AuthLayout>
  );
}

// 辅助函数：获取 scope 的可读标签
function getScopeLabel(scope: string): string {
  const scopeLabels: Record<string, string> = {
    openid: '验证身份',
    email: '访问邮箱',
    profile: '访问基本资料',
  };
  return scopeLabels[scope] || scope;
}
