import { Button, Card, Typography, Spin, Alert } from 'antd';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';

import { AuthLayout } from '@/layouts/AuthLayout';
import { getSupabaseClient } from '@/lib/supabase';
import { ROUTE_LOGIN, ROUTE_OAUTH_CONSENT } from '@/routes/router';
import { useAuthStore } from '@/stores/auth';

/**
 * 安全地访问嵌套属性的辅助函数
 */
function safeGet<T>(obj: unknown, path: string[], defaultValue: T): T {
  let result: unknown = obj;
  for (const key of path) {
    if (
      result === null ||
      result === undefined ||
      typeof result !== 'object' ||
      !(key in result)
    ) {
      return defaultValue;
    }
    result = (result as Record<string, unknown>)[key];
  }
  return (result as T) ?? defaultValue;
}

/**
 * 辅助函数，自动调用授权通过
 */
async function autoApproveAuthorization(
  supabase: ReturnType<typeof getSupabaseClient>,
  authorizationId: string
) {
  const { data, error } =
    await supabase.auth.oauth.approveAuthorization(authorizationId);
  if (error) {
    throw error;
  }
  return data;
}

export function OAuthConsent() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { clearFlowState, supabaseSession } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [authDetails, setAuthDetails] = useState<{
    client: { name: string };
    redirect_uri: string;
    scope?: string;
  } | null>(null);
  const [initialized, setInitialized] = useState(false);

  // 从 URL 获取 authorization_id
  const authorizationId = searchParams.get('authorization_id');

  useEffect(() => {
    // 如果不在 OAuth consent 路径，直接返回，不运行逻辑
    if (location.pathname !== ROUTE_OAUTH_CONSENT) {
      setLoading(false);
      setInitialized(true);
      return;
    }

    async function loadAuthDetails() {
      // 防止重复运行
      if (initialized) return;

      if (!authorizationId) {
        setErrorMsg('缺少授权ID');
        setLoading(false);
        setInitialized(true);
        return;
      }

      const supabase = getSupabaseClient();
      let user = null;

      try {
        // 先检查用户是否在 Supabase 中登录了
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();
        user = currentUser;

        // 如果没有登录但是有存储的 session，先设置 session
        if (!user && supabaseSession) {
          try {
            await supabase.auth.setSession({
              access_token: supabaseSession.access_token,
              refresh_token: supabaseSession.refresh_token,
            });
            // 再次获取用户
            const {
              data: { user: newUser },
            } = await supabase.auth.getUser();
            user = newUser;
          } catch {
            // setSession 失败，可能是 token 过期
            user = null;
          }
        }

        // 如果还是没有用户，跳转到登录页
        if (!user) {
          setInitialized(true);
          // 确保 authorizationId 有效后再构建 redirect URL
          if (authorizationId) {
            const redirectUrl = `/oauth/consent?authorization_id=${encodeURIComponent(authorizationId)}`;
            const loginUrl = `${ROUTE_LOGIN}?redirect=${encodeURIComponent(redirectUrl)}`;
            navigate(loginUrl, { replace: true });
          } else {
            // 如果没有有效的 authorizationId，直接跳转到登录页
            navigate(ROUTE_LOGIN, { replace: true });
          }
          return;
        }

        const { data, error } =
          await supabase.auth.oauth.getAuthorizationDetails(authorizationId);

        // 如果是 AuthSessionMissingError，说明需要先登录
        if (error?.name === 'AuthSessionMissingError') {
          setInitialized(true);
          // 确保 authorizationId 有效后再构建 redirect URL
          if (authorizationId) {
            const redirectUrl = `/oauth/consent?authorization_id=${encodeURIComponent(authorizationId)}`;
            const loginUrl = `${ROUTE_LOGIN}?redirect=${encodeURIComponent(redirectUrl)}`;
            navigate(loginUrl, { replace: true });
          } else {
            // 如果没有有效的 authorizationId，直接跳转到登录页
            navigate(ROUTE_LOGIN, { replace: true });
          }
          return;
        }

        if (error) {
          setErrorMsg(error.message);
          setLoading(false);
          setInitialized(true);
          return;
        }

        // 判断是否为重定向还是授权详情
        if ('redirect_to' in data) {
          // 如果是重定向，直接跳转
          const redirectTo = (data as { redirect_to: string }).redirect_to;
          setInitialized(true);
          window.location.href = redirectTo;
          return;
        }

        // 验证数据形状，确保它具有我们需要的属性
        const isAuthDetails = (
          d: unknown
        ): d is {
          client?: { name?: string };
          redirect_uri?: string;
          scope?: string;
        } => {
          return typeof d === 'object' && d !== null;
        };

        if (isAuthDetails(data)) {
          setAuthDetails(data);
          // 立即自动授权
          try {
            const approveData = await autoApproveAuthorization(
              supabase,
              authorizationId
            );
            if ('redirect_to' in approveData) {
              window.location.href = (
                approveData as { redirect_to: string }
              ).redirect_to;
              return;
            }
          } catch (error) {
            console.error('Auto approve failed:', error);
            setErrorMsg(t('oauth.approveFailed', '授权失败，请重试'));
          }
        } else {
          // 如果数据格式不符合预期，设置错误
          setErrorMsg(t('oauth.invalidData', '收到无效的授权数据'));
        }
        setLoading(false);
        setInitialized(true);
      } catch (e) {
        setErrorMsg(
          e instanceof Error
            ? e.message
            : t('oauth.loadFailed', '加载授权信息失败')
        );
        setLoading(false);
        setInitialized(true);
      }
    }

    loadAuthDetails();
  }, [authorizationId, navigate, supabaseSession, location.pathname, t]);

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
          {authDetails ? (
            <Card
              style={{ maxWidth: 400, margin: '0 auto' }}
              title={
                <div style={{ textAlign: 'center' }}>
                  <Typography.Title level={4} style={{ margin: 0 }}>
                    {t(
                      'oauth.appRequestTitle',
                      '{{appName}} 申请访问您的信息',
                      {
                        appName: safeGet(
                          authDetails,
                          ['client', 'name'],
                          '应用'
                        ),
                      }
                    )}
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
                {authDetails.scope && (
                  <ul
                    style={{
                      listStyleType: 'disc',
                      paddingLeft: 24,
                      margin: 0,
                    }}
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
          ) : (
            <Alert
              type='warning'
              message={t('oauth.noDetails', '无法获取授权详情，请稍后重试')}
              showIcon
            />
          )}
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
