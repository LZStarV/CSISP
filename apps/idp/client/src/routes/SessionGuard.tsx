import type { SessionResult } from '@csisp/idl/idp';
import { message } from 'antd';
import { ReactNode, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { call, hasError } from '@/api/rpc';
import { ROUTE_LOGIN, ROUTE_FINISH } from '@/routes/router';

export function SessionGuard({ children }: { children: ReactNode }) {
  const [checking, setChecking] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const hasQuery = !!location.search && location.search.length > 1;
    if (hasQuery) {
      setChecking(false);
      return;
    }
    (async () => {
      try {
        const res = await call<SessionResult>('auth/session', {});
        if (hasError(res)) {
          const msg = res?.error?.message || '服务器错误或连接失败，请稍后重试';
          message.error(msg);
          if (location.pathname !== ROUTE_LOGIN) {
            navigate(ROUTE_LOGIN);
            return;
          }
        } else {
          const logged = !!res.result?.logged;
          if (logged) {
            if (location.pathname === ROUTE_LOGIN) {
              navigate(ROUTE_FINISH, { state: { fromGuard: true } });
              return;
            }
          } else {
            if (location.pathname !== ROUTE_LOGIN) {
              navigate(ROUTE_LOGIN);
              return;
            }
          }
        }
      } catch {
        message.error('服务器错误或连接失败，请稍后重试');
        if (location.pathname !== ROUTE_LOGIN) {
          navigate(ROUTE_LOGIN);
          return;
        }
      }
      setChecking(false);
    })();
  }, [navigate, location.pathname]);

  if (checking) return null;
  return <>{children}</>;
}
