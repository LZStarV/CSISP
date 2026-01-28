import { ReactNode, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { call } from '@/api/rpc';

export function SessionGuard({ children }: { children: ReactNode }) {
  const [checking, setChecking] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const res = await call('auth/session', {});
        const logged = !!res?.result?.logged;
        if (logged) {
          if (location.pathname === '/login') {
            navigate('/finish', { state: { fromGuard: true } });
            return;
          }
        } else {
          if (location.pathname !== '/login') {
            navigate('/login');
            return;
          }
        }
      } catch {}
      setChecking(false);
    })();
  }, [navigate, location.pathname]);

  if (checking) return null;
  return <>{children}</>;
}
