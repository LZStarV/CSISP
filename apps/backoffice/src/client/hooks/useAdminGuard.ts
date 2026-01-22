import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { checkLogin } from '@/src/client/utils/auth';

export function useAdminGuard(): void {
  const router = useRouter();
  useEffect(() => {
    let canceled = false;
    (async () => {
      const ok = await checkLogin();
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
