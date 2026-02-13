'use client';
import { useAuth } from '@csisp/auth/react';
import { Button, Card, Typography, Space, message } from 'antd';

export default function LoginPage() {
  const { login } = useAuth();

  const handleLogin = async () => {
    try {
      await login();
    } catch (error: any) {
      message.error('登录初始化失败: ' + error.message);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        padding: '100px 16px',
      }}
    >
      <Card
        bordered
        style={{
          width: '100%',
          maxWidth: 400,
          textAlign: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        }}
      >
        <Space direction='vertical' size='large' style={{ width: '100%' }}>
          <Typography.Title level={2}>CSISP 管理后台</Typography.Title>
          <Typography.Text type='secondary'>
            请通过统一身份认证平台 (IdP) 登录
          </Typography.Text>
          <Button type='primary' size='large' onClick={handleLogin} block>
            跳转至 IdP 登录
          </Button>
        </Space>
      </Card>
    </div>
  );
}
