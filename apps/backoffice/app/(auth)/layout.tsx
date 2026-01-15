'use client';
import { Layout, ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider locale={zhCN}>
      <Layout style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <Layout.Content style={{ width: 420 }}>{children}</Layout.Content>
      </Layout>
    </ConfigProvider>
  );
}
