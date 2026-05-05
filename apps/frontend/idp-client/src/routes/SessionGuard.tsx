import { message } from 'antd';
import { ReactNode, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { commonAuthApi } from '@/api/common/auth';
import { idpClientAuthApi } from '@/api/idp-client/auth';
import {
  ROUTE_LOGIN,
  ROUTE_FINISH,
  ROUTE_OAUTH_CONSENT,
} from '@/routes/router';
import { useSessionStore } from '@/stores/session';

export function SessionGuard({ children }: { children: ReactNode }) {
  const [checking, setChecking] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { isLoggedIn, lastChecked, setSession, clearSession } =
    useSessionStore();

  useEffect(() => {
    if (location.pathname === ROUTE_OAUTH_CONSENT) {
      setChecking(false);
      return;
    }

    const params = new URLSearchParams(location.search);
    const tokenHash = params.get('token_hash');
    const type = params.get('type');
    const redirect = params.get('redirect');

    // 检查 redirect 是否指向 OAuth consent 页面
    let isRedirectToOAuthConsent = false;
    if (redirect) {
      try {
        const decodedRedirect = decodeURIComponent(redirect);
        isRedirectToOAuthConsent =
          decodedRedirect.startsWith(ROUTE_OAUTH_CONSENT);
      } catch {
        // 解码失败，忽略
      }
    }

    if (tokenHash && type) {
      (async () => {
        try {
          const res = await idpClientAuthApi.verifyOtp({
            token: tokenHash,
          } as any);
          if (res?.verified) {
            // 如果有 redirect 参数，跳转到 redirect 地址
            if (redirect) {
              const decodedRedirect = decodeURIComponent(redirect);
              navigate(decodedRedirect, { replace: true });
            } else {
              navigate(ROUTE_FINISH, { replace: true });
            }
            return;
          }
        } catch {}
        setChecking(false);
      })();
      return;
    }

    const now = Date.now();
    const ONE_MINUTE = 60 * 1000;

    // 如果距离上次检查不足1分钟，使用缓存
    if (isLoggedIn && lastChecked > 0 && now - lastChecked < ONE_MINUTE) {
      if (location.pathname === ROUTE_LOGIN) {
        // 只有当 redirect 不是指向 OAuth consent 页面时，才使用缓存跳转
        if (redirect && !isRedirectToOAuthConsent) {
          const decodedRedirect = decodeURIComponent(redirect);
          navigate(decodedRedirect, { replace: true });
        } else if (!redirect) {
          navigate(ROUTE_FINISH, { state: { fromGuard: true } });
        }
      }
      setChecking(false);
      return;
    }

    (async () => {
      try {
        const res = await commonAuthApi.session();
        const logged = !!res?.logged;
        const name = (res as any)?.name;
        const student_id = (res as any)?.student_id;

        if (logged) {
          setSession(true, { name, student_id });
          if (location.pathname === ROUTE_LOGIN) {
            // 如果有 redirect 参数，跳转到 redirect 地址
            // 但如果是 OAuth consent 页面，我们就不在这里跳，而是让用户在登录页面完成登录后再跳转
            if (redirect && !isRedirectToOAuthConsent) {
              const decodedRedirect = decodeURIComponent(redirect);
              navigate(decodedRedirect, { replace: true });
            } else if (!redirect) {
              navigate(ROUTE_FINISH, { state: { fromGuard: true } });
            }
          }
        } else {
          clearSession();
          if (location.pathname !== ROUTE_LOGIN) {
            navigate(ROUTE_LOGIN);
            return;
          }
        }
      } catch {
        message.error('服务器错误或连接失败，请稍后重试');
        clearSession();
        if (location.pathname !== ROUTE_LOGIN) {
          navigate(ROUTE_LOGIN);
          return;
        }
      }
      setChecking(false);
    })();
  }, [
    navigate,
    location.pathname,
    location.search,
    isLoggedIn,
    lastChecked,
    setSession,
    clearSession,
  ]);

  if (checking) return null;
  return <>{children}</>;
}
