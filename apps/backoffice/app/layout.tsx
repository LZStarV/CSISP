'use client';
import { ConfigProvider, App } from 'antd';
import zhCN from 'antd/locale/zh_CN';

import 'antd/dist/reset.css';
import '@/src/client/ui/style/globals.scss';
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
          <App style={{ height: '100vh' }}>
            <AntdGlobal />
            {children}
          </App>
        </ConfigProvider>
      </body>
    </html>
  );
}
