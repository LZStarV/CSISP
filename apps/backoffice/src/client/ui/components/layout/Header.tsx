'use client';
import { UserOutlined, LogoutOutlined } from '@ant-design/icons';
import { useAuth } from '@csisp/auth/react';
import { Layout, Dropdown, Space, Avatar } from 'antd';
import { useRouter } from 'next/navigation';

import { message, modal } from '@/src/client/utils/antd';

export default function HeaderBar() {
  const { user, logout: sdkLogout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    modal?.confirm({
      title: '退出登录',
      content: '确定要退出登录吗？',
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        try {
          await sdkLogout();
          message.success('已退出登录');
          router.replace('/login');
        } catch {
          message.error('退出登录失败');
        }
      },
    });
  };

  const menuItems = [
    {
      key: 'logout',
      label: '退出登录',
      icon: <LogoutOutlined />,
      onClick: handleLogout,
    },
  ];

  return (
    <Layout.Header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
      }}
    >
      <div style={{ color: '#fff', fontWeight: 600, fontSize: '18px' }}>
        CSISP Backoffice
      </div>
      {user && (
        <Dropdown menu={{ items: menuItems }} placement='bottomRight'>
          <Space style={{ cursor: 'pointer', color: '#fff' }}>
            <Avatar
              icon={<UserOutlined />}
              style={{ backgroundColor: '#1890ff' }}
            />
            <span>{user.preferred_username || user.sub}</span>
          </Space>
        </Dropdown>
      )}
    </Layout.Header>
  );
}
