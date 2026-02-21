'use client';
import { AuthProvider } from '@csisp/auth/react';
import { ConfigProvider, App } from 'antd';
import zhCN from 'antd/locale/zh_CN';

import 'antd/dist/reset.css';
import '@/src/client/ui/style/globals.scss';
import { authConfig } from '@/src/client/config/auth';
import { AntdGlobal } from '@/src/client/utils/antd';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='zh-CN'>
      <body style={{ margin: 0 }}>
        <ConfigProvider locale={zhCN}>
          <AuthProvider
            clientId='backoffice'
            apiPrefix='/api/backoffice'
            loginUrl={authConfig.idpLoginUrl}
            redirectUri='/api/auth/callback'
          >
            <App style={{ height: '100vh' }}>
              <AntdGlobal />
              {children}
            </App>
          </AuthProvider>
        </ConfigProvider>
      </body>
    </html>
  );
}
