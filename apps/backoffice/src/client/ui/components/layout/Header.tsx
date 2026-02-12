'use client';
import { UserOutlined, LogoutOutlined } from '@ant-design/icons';
import { Layout, Dropdown, Space, Avatar } from 'antd';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { message, modal } from '@/src/client/utils/antd';
import { authCall, hasError } from '@/src/client/utils/rpc-client';

export default function HeaderBar() {
  const [user, setUser] = useState<{
    username: string;
    roles: string[];
  } | null>(null);
  const router = useRouter();

  useEffect(() => {
    authCall<{ user: { username: string; roles: string[] } }>('me', {}).then(
      res => {
        if (!hasError(res)) {
          setUser(res.result.user);
        } else {
          message.error('获取用户信息失败: ' + res.error.message);
        }
      }
    );
  }, []);

  const handleLogout = () => {
    modal?.confirm({
      title: '退出登录',
      content: '确定要退出登录吗？',
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        try {
          const res = await authCall('logout', {});
          if (!hasError(res)) {
            message.success('已退出登录');
            router.replace('/login');
          } else {
            message.error('退出登录失败');
          }
        } catch (err) {
          message.error('请求失败');
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
            <span>{user.username}</span>
          </Space>
        </Dropdown>
      )}
    </Layout.Header>
  );
}
