'use client';
import { Layout, theme } from 'antd';
export default function PageShell({ children }: { children: React.ReactNode }) {
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();
  return (
    <Layout style={{ padding: '0 24px 24px' }}>
      <Layout.Content
        style={{
          padding: 24,
          margin: 0,
          minHeight: 280,
          background: colorBgContainer,
          borderRadius: borderRadiusLG,
        }}
      >
        {children}
      </Layout.Content>
    </Layout>
  );
}
