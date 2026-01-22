'use client';
import { Form, Input, Button, Card, Typography } from 'antd';

export default function LoginPage() {
  const [form] = Form.useForm();
  const onFinish = (_values: any) => {
    // 保留占位，不触发网络请求；后续接入 JSON-RPC 的 auth.login
  };
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        padding: '48px 16px',
      }}
    >
      <Card
        bordered
        style={{
          width: '100%',
          maxWidth: 420,
        }}
      >
        <Typography.Title
          level={3}
          style={{
            textAlign: 'center',
            marginBottom: 24,
          }}
        >
          登录
        </Typography.Title>
        <Form
          style={{ marginTop: 8 }}
          form={form}
          layout='vertical'
          onFinish={onFinish}
        >
          <Form.Item
            name='username'
            label='用户名'
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input placeholder='请输入用户名' />
          </Form.Item>
          <Form.Item
            name='password'
            label='密码'
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password placeholder='请输入密码' />
          </Form.Item>
          <Form.Item>
            <Button type='primary' htmlType='submit' block>
              登录
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
