import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { authCall, hasError } from '@/src/client/utils/rpc-client';

export function useAdminGuard(): void {
  const router = useRouter();
  useEffect(() => {
    let canceled = false;
    (async () => {
      let ok = false;
      try {
        const res = await authCall<{ user: any }>('me', {});
        ok = !hasError(res) && !!res.result?.user;
      } catch {
        ok = false;
      }

      if (!ok && !canceled && typeof window !== 'undefined') {
        const next = encodeURIComponent(
          window.location.pathname + window.location.search
        );
        router.replace(`/login?next=${next}`);
      }
    })();
    return () => {
      canceled = true;
    };
  }, [router]);
}
