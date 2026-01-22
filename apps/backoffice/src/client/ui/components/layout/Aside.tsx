'use client';
import {
  UserOutlined,
  FileSearchOutlined,
  DatabaseOutlined,
} from '@ant-design/icons';
import { Layout, Menu } from 'antd';
import Link from 'next/link';

import { NAV_ITEMS } from '@/src/client/config/navigation';
const ICONS: Record<string, React.ReactNode> = {
  UserOutlined: <UserOutlined />,
  FileSearchOutlined: <FileSearchOutlined />,
  DatabaseOutlined: <DatabaseOutlined />,
};
export default function Aside() {
  return (
    <Layout.Sider width={200}>
      <Menu
        theme='dark'
        mode='inline'
        style={{ height: '100%', borderInlineEnd: 0 }}
        defaultSelectedKeys={[NAV_ITEMS[0]?.key ?? '']}
        items={NAV_ITEMS.map(i => ({
          key: i.key,
          icon: ICONS[i.icon || ''],
          label: <Link href={i.href}>{i.label}</Link>,
        }))}
      />
    </Layout.Sider>
  );
}
