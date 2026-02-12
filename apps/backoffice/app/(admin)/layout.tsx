'use client';
import { Layout } from 'antd';
import type { ReactNode } from 'react';

import { useAdminGuard } from '@/src/client/hooks/useAdminGuard';
import Aside from '@/src/client/ui/components/layout/Aside';
import HeaderBar from '@/src/client/ui/components/layout/Header';
import PageShell from '@/src/client/ui/components/layout/PageShell';

export default function BackofficeLayout({
  children,
}: {
  children: ReactNode;
}) {
  useAdminGuard();
  return (
    <Layout style={{ height: '100%' }}>
      <HeaderBar />
      <Layout>
        <Aside />
        <PageShell>{children}</PageShell>
      </Layout>
    </Layout>
  );
}
