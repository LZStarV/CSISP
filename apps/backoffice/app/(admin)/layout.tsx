'use client';
import { Layout, ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import HeaderBar from '@/src/client/ui/components/layout/Header';
import Aside from '@/src/client/ui/components/layout/Aside';
import PageShell from '@/src/client/ui/components/layout/PageShell';
export default function BackofficeLayout({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider locale={zhCN}>
      <Layout>
        <HeaderBar />
        <Layout>
          <Aside />
          <PageShell>{children}</PageShell>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
}
