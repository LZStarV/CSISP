import { message } from 'antd';
import { ReactNode, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { commonAuthApi } from '@/api/common/auth';
import { idpClientAuthApi } from '@/api/idp-client/auth';
import { ROUTE_LOGIN, ROUTE_FINISH } from '@/routes/router';

export function SessionGuard({ children }: { children: ReactNode }) {
  const [checking, setChecking] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

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
    (async () => {
      try {
        const res = await commonAuthApi.session();
        const logged = !!res?.logged;
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
