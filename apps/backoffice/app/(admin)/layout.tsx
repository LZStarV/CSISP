'use client';
import { AuthGuard } from '@csisp/auth/react';
import { Layout } from 'antd';
import type { ReactNode } from 'react';

import Aside from '@/src/client/ui/components/layout/Aside';
import HeaderBar from '@/src/client/ui/components/layout/Header';
import PageShell from '@/src/client/ui/components/layout/PageShell';

export default function BackofficeLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <AuthGuard>
      <Layout style={{ height: '100%' }}>
        <HeaderBar />
        <Layout>
          <Aside />
          <PageShell>{children}</PageShell>
        </Layout>
      </Layout>
    </AuthGuard>
  );
}
