import { message } from 'antd';
import { ReactNode, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { commonAuthApi } from '@/api/common/auth';
import { idpClientAuthApi } from '@/api/idp-client/auth';
import { ROUTE_LOGIN, ROUTE_FINISH } from '@/routes/router';
import { useSessionStore } from '@/stores/session';

export function SessionGuard({ children }: { children: ReactNode }) {
  const [checking, setChecking] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { isLoggedIn, lastChecked, setSession, clearSession } =
    useSessionStore();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tokenHash = params.get('token_hash');
    const type = params.get('type');
    if (tokenHash && type) {
      (async () => {
        try {
          const res = await idpClientAuthApi.verifyOtp({
            token: tokenHash,
          } as any);
          if (res?.verified) {
            navigate(ROUTE_FINISH, { replace: true });
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
        navigate(ROUTE_FINISH, { state: { fromGuard: true } });
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
            navigate(ROUTE_FINISH, { state: { fromGuard: true } });
            return;
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
    isLoggedIn,
    lastChecked,
    setSession,
    clearSession,
  ]);

  if (checking) return null;
  return <>{children}</>;
}
